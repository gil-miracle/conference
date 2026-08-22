"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { normalizePhone } from "@/lib/format";
import type { ParticipantCsvRow } from "@/lib/csv";

/** 명단 CSV 업서트 — 같은 (이름, 생년월일, 전화번호)는 갱신, 새 조합은 추가 */
export async function upsertParticipants(rows: ParticipantCsvRow[]) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const clean = rows
    .map((r) => ({
      name: r.name.trim(),
      birth_date: r.birth.trim(),
      phone: normalizePhone(r.phone),
    }))
    .filter((r) => r.name && /^\d{4}-\d{2}-\d{2}$/.test(r.birth_date) && r.phone);

  if (clean.length === 0)
    return { ok: false as const, message: "유효한 행이 없어요." };

  let saved = 0;
  for (let i = 0; i < clean.length; i += 200) {
    const chunk = clean.slice(i, i + 200);
    const { error, count } = await ctx.supabase
      .from("participants")
      .upsert(chunk, {
        onConflict: "name,birth_date,phone",
        ignoreDuplicates: false,
        count: "exact",
      });
    if (error)
      return {
        ok: false as const,
        message: `${i}행 부근에서 실패: ${error.message}`,
      };
    saved += count ?? chunk.length;
  }
  revalidatePath("/admin");
  return {
    ok: true as const,
    message: `${saved}명 저장 완료 (${clean.length}행 처리)`,
  };
}
