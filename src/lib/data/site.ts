import { cookies } from "next/headers";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseSiteSettings } from "@/lib/settings";
import { GUESTBOOK_FALLBACK } from "@/lib/content";
import { DEMO_COOKIE, DEMO_SUMMARY } from "@/lib/demo";
import type { BannerSetting, GuestbookEntry, MySummary, Photo } from "@/lib/types";

/** 모든 사이트 페이지가 공유하는 세션·설정 컨텍스트 */
export type SiteContext = {
  authed: boolean;
  summary: MySummary | null;
  banner: BannerSetting | null;
  galleryOpen: boolean;
  guestbookOpen: boolean;
  /** Supabase 미설정 + 미리보기 쿠키/쿼리 → 가짜 세션 */
  demoMode: boolean;
};

/** 미리보기 모드 활성 여부 (env 미설정일 때만) */
async function isDemo(demoOverride: boolean) {
  if (isSupabaseConfigured()) return false;
  if (demoOverride) return true;
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(DEMO_COOKIE));
}

export async function getSiteContext(demoOverride = false): Promise<SiteContext> {
  const ctx: SiteContext = {
    authed: false,
    summary: null,
    banner: null,
    galleryOpen: false,
    guestbookOpen: true,
    demoMode: false,
  };

  const supabase = await getSupabaseServer();

  if (!supabase) {
    if (await isDemo(demoOverride)) {
      ctx.demoMode = true;
      ctx.authed = true;
      ctx.summary = DEMO_SUMMARY;
      ctx.galleryOpen = true;
    }
    return ctx;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  ctx.authed = Boolean(user);

  const { data: settingsRows } = await supabase
    .from("site_settings")
    .select("key,value");
  const settings = parseSiteSettings(settingsRows);
  ctx.banner = settings.banner.visible ? settings.banner : null;
  ctx.galleryOpen = settings.galleryOpen;
  ctx.guestbookOpen = settings.guestbookOpen;

  if (user) {
    const { data: summary } = await supabase.rpc("get_my_summary");
    ctx.summary = summary as MySummary | null;
  }
  return ctx;
}

/** 방명록 목록 — limit으로 메인 요약(3개)과 전체 페이지(30개)를 겸한다 */
export async function getGuestbook(limit = 30): Promise<GuestbookEntry[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return GUESTBOOK_FALLBACK.slice(0, limit);

  const { data } = await supabase
    .from("guestbook")
    .select("id,display_name,content,created_at,participant_id")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as GuestbookEntry[]) ?? [];
}

export async function getPhotos(limit = 24): Promise<Photo[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("photos")
    .select("id,participant_id,cloudinary_public_id,width,height,created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Photo[]) ?? [];
}
