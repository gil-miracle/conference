"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { logAdmin } from "@/lib/audit";

export async function setGuestbookHidden(id: string, hidden: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const { data } = await ctx.supabase
    .from("guestbook")
    .update({ hidden })
    .eq("id", id)
    .select("display_name")
    .maybeSingle();
  await logAdmin(ctx, "note_hide", data?.display_name ?? null, { hidden });
  revalidatePath("/admin/board");
  revalidatePath("/");
}

export async function deleteGuestbookAdmin(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  /* 지우기 전에 무엇을 지우는지 읽어 둔다 — 지운 뒤에는 남는 것이 없다 */
  const { data: gone } = await ctx.supabase
    .from("guestbook")
    .select("display_name,content")
    .eq("id", id)
    .maybeSingle();
  await ctx.supabase.from("guestbook").delete().eq("id", id);
  await logAdmin(ctx, "note_delete", gone?.display_name ?? null, {
    content: gone?.content?.slice(0, 80),
  });
  revalidatePath("/admin/board");
  revalidatePath("/");
}

export async function setPhotoHidden(id: string, hidden: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("photos").update({ hidden }).eq("id", id);
  await logAdmin(ctx, "photo_hide", null, { id, hidden });
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
  const { data: gone } = await ctx.supabase
    .from("photos")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle();
  await ctx.supabase.from("photos").delete().eq("id", id);
  await logAdmin(ctx, "photo_delete", gone?.cloudinary_public_id ?? null);
  revalidatePath("/admin/board");
  revalidatePath("/");
}
