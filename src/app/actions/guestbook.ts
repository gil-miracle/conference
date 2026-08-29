"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getBoundParticipant } from "@/lib/participant";
import { GUESTBOOK_MAX, GUESTBOOK_NAME_MAX } from "@/lib/guestbook";


export type GuestbookState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function addGuestbookEntry(
  _prev: GuestbookState,
  formData: FormData
): Promise<GuestbookState> {
  const ctx = await getBoundParticipant();
  if (!ctx)
    return {
      status: "error",
      message: "로그인하고 신청 명단과 연결한 뒤 작성할 수 있어요.",
    };

  // 작성자는 명단의 그 사람이다 — 로그인해야 쓸 수 있으니 물어볼 것이 없다
  const displayName = ctx.me.name.slice(0, GUESTBOOK_NAME_MAX);
  const content = String(formData.get("content") ?? "").trim();
  if (!content || content.length > GUESTBOOK_MAX)
    return {
      status: "error",
      message: `내용은 1–${GUESTBOOK_MAX}자로 적어주세요.`,
    };

  const { error } = await ctx.supabase.from("guestbook").insert({
    participant_id: ctx.me.id,
    display_name: displayName,
    content,
  });
  if (error)
    return {
      status: "error",
      message: "작성에 실패했어요. 작성이 닫혀 있거나 일시적 오류일 수 있어요.",
    };

  revalidatePath("/");
  return { status: "ok", message: "방명록이 등록됐어요." };
}

/**
 * 본인 글 삭제. 권한은 RLS(`participant_id = my_participant_id() or is_admin()`)가 판단하며,
 * 막히면 오류 없이 0행이 지워진다 — 삭제된 행 수를 확인해야 성공/실패를 구분할 수 있다.
 */
export async function deleteGuestbookEntry(id: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false as const };

  const { data, error } = await supabase
    .from("guestbook")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) return { ok: false as const };

  revalidatePath("/");
  revalidatePath("/guestbook");
  return { ok: true as const };
}
