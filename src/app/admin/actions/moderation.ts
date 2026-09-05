"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function setGuestbookHidden(id: string, hidden: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("guestbook").update({ hidden }).eq("id", id);
  revalidatePath("/admin/board");
  revalidatePath("/");
}

export async function deleteGuestbookAdmin(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("guestbook").delete().eq("id", id);
  revalidatePath("/admin/board");
  revalidatePath("/");
}

export async function setPhotoHidden(id: string, hidden: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("photos").update({ hidden }).eq("id", id);
  revalidatePath("/admin/board");
  revalidatePath("/");
}

/**
 * 사진을 아주 지운다.
 *
 * 참가자 화면에는 지우는 길이 없다 — 남들이 이미 본 것이 말없이 사라지고
 * 되돌릴 방법도 없어서, 내리는 일은 이 화면 한 곳으로 모았다.
 * 웬만하면 숨김으로 충분하다. 이건 되돌릴 수 없다.
 */
/** 끌어서 바꾼 차례를 저장한다 — 목록을 통째로 넘겨 한 번에 매긴다 (0039) */
export async function reorderPhotos(ids: string[]) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.rpc("admin_reorder_photos", { p_ids: ids });
  revalidatePath("/admin/board");
  revalidatePath("/");
}

export async function deletePhotoAdmin(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("photos").delete().eq("id", id);
  revalidatePath("/admin/board");
  revalidatePath("/");
}
