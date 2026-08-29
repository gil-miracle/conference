"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { extractSheetId, readSheetValues } from "@/lib/google/sheets";
import { getServiceAccount } from "@/lib/google/auth";
import { parseSheetParticipants, participantKey } from "@/lib/sheet-participants";

export type SheetSyncResult =
  | { ok: false; message: string }
  | {
      ok: true;
      /** 어느 항목을 어느 열에서 읽었는지 */
      headers: { field: string; label: string; columns: string[] }[];
      /** 시트에서 읽은 사람 수 */
      total: number;
      /** 이번에 새로 들어온 사람 */
      added: number;
      /** 이미 있던 사람 중 비어 있던 칸을 채운 사람 */
      filled: number;
      /** 이미 있던 사람 — 손대지 않았다 */
      unchanged: number;
      /** DB에는 있는데 시트에서 사라진 사람 — 지우는 건 관리자가 판단한다 */
      missing: {
        id: string;
        name: string;
        birth_date: string;
        phone: string;
        checkedIn: boolean;
        bound: boolean;
      }[];
      /** 값이 모자라 건너뛴 시트 행 */
      skipped: { row: number; reason: string }[];
    };

/**
 * 구글 시트에서 참가자 명단을 동기화한다.
 *
 * **명단에 없는 사람은 새로 넣고, 있는 사람은 빈 칸만 채운다.**
 *
 * 값이 든 칸은 절대 덮어쓰지 않는다 — 신청 정보를 화면에서 고칠 수 있게 된
 * 뒤로, 동기화가 시트 값으로 밀어버리면 고친 보람이 없어진다. 시트 값으로
 * 되돌리려면 그 사람을 지우고 다시 동기화하면 된다.
 *
 * 빈 칸만 채우는 건 시트에 열이 새로 생길 때를 위해서다. 성별처럼 나중에
 * 추가된 항목이 이미 명단에 있는 사람에게는 영영 안 들어오면, 그 한 칸 때문에
 * 쉰 명을 지웠다 다시 넣어야 한다.
 *
 * 지우지도 않는다. 시트에서 빠진 사람은 목록으로만 돌려주고 삭제는 관리자가
 * 하나씩 결정한다 — 체크인·숙소 배정·방명록이 딸린 사람을 실수 한 번으로
 * 날리면 되돌릴 방법이 없다.
 */
export async function syncParticipantsFromSheet(): Promise<SheetSyncResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  if (!getServiceAccount())
    return {
      ok: false,
      message:
        "구글 서비스 계정이 설정되지 않았어요. GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY를 채워주세요.",
    };

  const sheetId = extractSheetId(process.env.GOOGLE_SHEETS_ID ?? "");
  if (!sheetId) return { ok: false, message: "GOOGLE_SHEETS_ID가 비어 있어요." };
  const range = process.env.GOOGLE_SHEETS_RANGE?.trim() || "A:Z";

  let values: string[][];
  try {
    values = await readSheetValues(sheetId, range);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "시트를 읽지 못했어요." };
  }

  const parsed = parseSheetParticipants(values);
  if (!parsed.headers)
    return {
      ok: false,
      message:
        "머리글을 찾지 못했어요. 시트 첫 부분에 이름·생년월일·전화번호 열이 있어야 해요.",
    };
  if (parsed.rows.length === 0)
    return { ok: false, message: "시트에서 읽을 수 있는 사람이 없어요." };

  const { data: existing, error: readErr } = await ctx.supabase
    .from("participants")
    // 한 줄로 둔다 — 이어붙이면 supabase 타입 추론이 열 목록을 못 읽는다
    .select("id,name,birth_date,phone,source,checked_in_at,auth_user_id,applicant_type,gender,cell_group,inviter,transport,arrive_day,arrive_time,stay,tshirt");
  if (readErr) return { ok: false, message: `기존 명단 조회 실패: ${readErr.message}` };

  const inDb = new Map((existing ?? []).map((p) => [participantKey(p), p]));
  const inSheet = new Set(parsed.rows.map(participantKey));

  /** 시트 한 줄을 DB 칼럼 이름으로 편다 */
  const toRow = (r: (typeof parsed.rows)[number]) => ({
    name: r.name,
    birth_date: r.birth,
    phone: r.phone,
    applicant_type: r.applicantType ?? null,
    gender: r.gender ?? null,
    cell_group: r.cellGroup ?? null,
    inviter: r.inviter ?? null,
    transport: r.transport ?? null,
    arrive_day: r.arriveDay ?? null,
    arrive_time: r.arriveTime ?? null,
    stay: r.stay ?? null,
    tshirt: r.tshirt ?? null,
  });
  type Row = ReturnType<typeof toRow>;
  const FILLABLE = [
    "applicant_type",
    "gender",
    "cell_group",
    "inviter",
    "transport",
    "arrive_day",
    "arrive_time",
    "stay",
    "tshirt",
  ] as const;

  const fresh: Row[] = [];
  const filled: Row[] = [];
  for (const r of parsed.rows) {
    const row = toRow(r);
    const old = inDb.get(participantKey(r)) as Record<string, unknown> | undefined;
    if (!old) {
      fresh.push(row);
      continue;
    }
    // 든 값은 그대로 두고 빈 칸만 시트 값으로 채운다. 채울 게 없으면 건너뛴다
    const merged = { ...row };
    let changed = false;
    for (const key of FILLABLE) {
      const kept = old[key];
      if (kept != null && kept !== "") merged[key] = kept as string;
      else if (row[key] != null) changed = true;
    }
    if (changed) filled.push(merged);
  }
  const added = fresh.length;

  const chunk = 200;
  for (let i = 0; i < fresh.length; i += chunk) {
    // 읽은 뒤 사이에 누가 같은 사람을 넣었더라도 조용히 넘어간다
    const { error } = await ctx.supabase
      .from("participants")
      .upsert(fresh.slice(i, i + chunk), {
        onConflict: "name,birth_date,phone",
        ignoreDuplicates: true,
      });
    if (error)
      return { ok: false, message: `${i + 1}번째 묶음에서 실패: ${error.message}` };
  }
  for (let i = 0; i < filled.length; i += chunk) {
    // merged는 DB 값을 그대로 담고 있어, 덮어써도 잃는 값이 없다
    const { error } = await ctx.supabase
      .from("participants")
      .upsert(filled.slice(i, i + chunk), {
        onConflict: "name,birth_date,phone",
        ignoreDuplicates: false,
      });
    if (error)
      return { ok: false, message: `빈 칸 채우기 ${i + 1}번째 묶음 실패: ${error.message}` };
  }

  // 화면에서 직접 넣은 사람(교역자·멘토)은 애초에 시트에 없다 — 매번
  // "사라진 사람"으로 올려 지우라고 권하면 안 된다
  const missing = (existing ?? [])
    .filter((p) => p.source !== "manual" && !inSheet.has(participantKey(p)))
    .map((p) => ({
      id: p.id as string,
      name: p.name as string,
      birth_date: p.birth_date as string,
      phone: p.phone as string,
      checkedIn: Boolean(p.checked_in_at),
      bound: Boolean(p.auth_user_id),
    }));

  revalidatePath("/admin");
  return {
    ok: true,
    headers: parsed.headers,
    total: parsed.rows.length,
    added,
    filled: filled.length,
    unchanged: parsed.rows.length - added - filled.length,
    missing,
    skipped: parsed.skipped,
  };
}
