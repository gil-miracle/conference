"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { normalizePhone, parseBirth8 } from "@/lib/format";
import { SIGNUP_FIELDS, isStaff } from "@/lib/participant-fields";
import type { SignupInfo } from "@/lib/types";

export type ParticipantInput = SignupInfo & {
  name: string;
  birth_date: string;
  phone: string;
};

type Result = { ok: false; message: string } | { ok: true; message: string };

/** 빈 칸은 null로 — ""와 null이 섞이면 같은 "없음"이 필터에서 갈라진다 */
const nz = (s: string | null | undefined) => {
  const t = (s ?? "").trim();
  return t ? t : null;
};

/** 이름·생년월일·전화 유니크 제약 위반 */
const DUPLICATE = "23505";

/**
 * 폼 값 정리.
 *
 * 전화번호는 하이픈 형태로, 생년월일은 YYYY-MM-DD로 맞춘다. 시트에서 들어온
 * 사람과 손으로 넣은 사람이 같은 모양이어야 (이름,생년월일,전화) 키가 맞고,
 * 같은 사람이 두 줄로 들어오지 않는다.
 */
function clean(input: ParticipantInput): {
  row?: Record<string, string | null>;
  error?: string;
} {
  const name = input.name.trim();
  if (!name) return { error: "이름을 입력해주세요." };
  // 교역자·멘토는 신청서를 안 써서 생년월일이 없다. 받으려면 따로 여줘야 하는데,
  // 명단에 넣는 데도 로그인 때 맞춰 보는 데도 이름과 전화번호면 충분하다.
  const staff = isStaff(input.applicant_type);
  const birth = parseBirth8(input.birth_date);
  if (!birth && !staff) return { error: "생년월일이 올바르지 않아요." };
  const phone = normalizePhone(input.phone ?? "");
  if (phone.replace(/\D/g, "").length < 10)
    return { error: "전화번호가 올바르지 않아요." };

  const row: Record<string, string | null> = { name, birth_date: birth, phone };
  for (const f of SIGNUP_FIELDS) row[f.key] = nz(input[f.key]);
  return { row };
}

/**
 * 사람 하나 추가.
 *
 * 교역자·멘토는 신청서를 쓰지 않으므로 시트에 없다. 화면에서 넣고
 * source=manual로 표시해 동기화가 "시트에서 사라진 사람"으로 잡지 않게 한다.
 */
export async function createParticipant(input: ParticipantInput): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const { row, error } = clean(input);
  if (!row) return { ok: false, message: error ?? "값을 확인해주세요." };

  const { error: err } = await ctx.supabase
    .from("participants")
    .insert({ ...row, source: "manual" });
  if (err)
    return {
      ok: false,
      message:
        err.code === DUPLICATE ? "이미 명단에 있는 사람이에요." : err.message,
    };

  revalidatePath("/admin");
  return { ok: true, message: `${row.name} 님을 명단에 넣었어요.` };
}

/**
 * 신청 정보 수정.
 *
 * 동기화가 이미 있는 사람을 건드리지 않으므로 여기서 고친 값은 유지된다.
 * 시트 값으로 되돌리려면 그 사람을 지우고 다시 동기화하면 된다.
 */
export async function updateParticipant(
  id: string,
  input: ParticipantInput
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const { row, error } = clean(input);
  if (!row) return { ok: false, message: error ?? "값을 확인해주세요." };

  // 정책에 막히면 에러가 아니라 0행으로 돌아온다 — 바뀐 걸 확인해야 한다
  const { data, error: err } = await ctx.supabase
    .from("participants")
    .update(row)
    .eq("id", id)
    .select("id");
  if (err)
    return {
      ok: false,
      message:
        err.code === DUPLICATE ? "같은 사람이 이미 명단에 있어요." : err.message,
    };
  if (!data?.length) return { ok: false, message: "변경되지 않았어요." };

  revalidatePath("/admin");
  return { ok: true, message: "저장했어요." };
}

/** 사람 하나 삭제 — 배정·체크인 기록도 함께 사라진다 */
export async function removeParticipant(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

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
