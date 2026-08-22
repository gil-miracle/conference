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
