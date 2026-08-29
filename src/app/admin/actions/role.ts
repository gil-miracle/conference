"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

/**
 * 관리자 권한 지정·해제.
 *
 * 지금까지는 SQL로만 됐다. 행사 현장에서 도와줄 사람을 그때그때 올려야 하는데
 * DB 콘솔을 여는 건 현실적이지 않아 화면으로 뺐다.
 *
 * 스스로는 못 내린다 — 마지막 관리자가 자기 권한을 내리면 아무도 관리자
 * 화면에 못 들어가고, 되돌리려면 다시 SQL을 열어야 한다.
 */
export async function setRole(participantId: string, role: "admin" | "member") {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  if (participantId === ctx.me.id && role === "member")
    return {
      ok: false as const,
      message: "자기 권한은 내릴 수 없어요. 다른 관리자에게 부탁하세요.",
    };

  // 정책에 막히면 에러가 아니라 0행으로 돌아온다 — 바뀐 걸 확인해야 한다
  const { data, error } = await ctx.supabase
    .from("participants")
    .update({ role })
    .eq("id", participantId)
    .select("id");
  if (error) return { ok: false as const, message: error.message };
  if (!data?.length) return { ok: false as const, message: "변경되지 않았어요." };

  revalidatePath("/admin");
  return { ok: true as const, message: role === "admin" ? "관리자로 지정했어요." : "관리자에서 내렸어요." };
}
