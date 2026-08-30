"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

/**
 * 쓸 수 있는 설정 키.
 *
 * site_settings는 **누구나 읽을 수 있는** 표다(배너를 비로그인 방문자에게도
 * 보여야 해서). 그래서 키를 열어두면 관리자 세션이 한 번 새는 것만으로 아무
 * 값이나 공개 자리에 심을 수 있다. 아는 키만 받는다.
 */
const KEYS = [
  "banner",
  "gallery_open",
  "guestbook_open",
  "rooms_open",
  "menu_visibility",
] as const;

export async function saveSetting(key: string, value: unknown) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  if (!(KEYS as readonly string[]).includes(key)) return { ok: false };

  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: !error };
}
