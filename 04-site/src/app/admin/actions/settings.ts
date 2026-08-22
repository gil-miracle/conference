"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function saveSetting(key: string, value: unknown) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: !error };
}
