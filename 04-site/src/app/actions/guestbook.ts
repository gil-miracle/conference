"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getBoundParticipant } from "@/lib/participant";

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

  const displayName = String(formData.get("display_name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!displayName || displayName.length > 20)
    return { status: "error", message: "이름(닉네임)은 1–20자로 적어주세요." };
  if (!content || content.length > 500)
    return { status: "error", message: "내용은 1–500자로 적어주세요." };

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

export async function deleteGuestbookEntry(id: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return;
  await supabase.from("guestbook").delete().eq("id", id);
  revalidatePath("/");
}
