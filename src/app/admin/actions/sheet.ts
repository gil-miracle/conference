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
      /** 이미 있던 사람 */
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
 * 시트를 원본으로 삼되 **지우지는 않는다.** 시트에서 빠진 사람은 목록으로만
 * 돌려주고 삭제는 관리자가 하나씩 결정한다 — 체크인·숙소 배정·방명록이 딸린
 * 사람을 실수 한 번으로 날리면 되돌릴 방법이 없다.
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
    .select("id,name,birth_date,phone,checked_in_at,auth_user_id");
  if (readErr) return { ok: false, message: `기존 명단 조회 실패: ${readErr.message}` };

  const inDb = new Map((existing ?? []).map((p) => [participantKey(p), p]));
  const inSheet = new Set(parsed.rows.map(participantKey));

  const added = parsed.rows.filter((r) => !inDb.has(participantKey(r))).length;

  // 이미 있는 사람까지 통째로 올린다 — 유니크 제약이 (이름,생년월일,전화)라
  // 중복이 생기지 않고, 시트 쪽 수정이 있었다면 그대로 반영된다
  const chunk = 200;
  for (let i = 0; i < parsed.rows.length; i += chunk) {
    const slice = parsed.rows.slice(i, i + chunk).map((r) => ({
      name: r.name,
      birth_date: r.birth,
      phone: r.phone,
      applicant_type: r.applicantType ?? null,
      cell_group: r.cellGroup ?? null,
      inviter: r.inviter ?? null,
      transport: r.transport ?? null,
      arrive_day: r.arriveDay ?? null,
      arrive_time: r.arriveTime ?? null,
      stay: r.stay ?? null,
      tshirt: r.tshirt ?? null,
    }));
    const { error } = await ctx.supabase
      .from("participants")
      .upsert(slice, { onConflict: "name,birth_date,phone", ignoreDuplicates: false });
    if (error)
      return { ok: false, message: `${i + 1}번째 묶음에서 실패: ${error.message}` };
  }

  const missing = (existing ?? [])
    .filter((p) => !inSheet.has(participantKey(p)))
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
    unchanged: parsed.rows.length - added,
    missing,
    skipped: parsed.skipped,
  };
}

/** 시트에서 빠진 사람 한 명 삭제 — 목록에서 관리자가 직접 고른 경우에만 */
export async function removeParticipant(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  // 정책에 막히면 에러가 아니라 0행으로 돌아온다 — 지워진 걸 확인해야 한다
  const { data, error } = await ctx.supabase
    .from("participants")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false as const, message: error.message };
  if (!data?.length) return { ok: false as const, message: "삭제되지 않았어요." };

  revalidatePath("/admin");
  return { ok: true as const, message: "삭제했어요." };
}
