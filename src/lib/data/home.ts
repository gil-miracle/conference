import { cookies } from "next/headers";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseSiteSettings } from "@/lib/settings";
import { GUESTBOOK_FALLBACK } from "@/lib/content";
import { DEMO_COOKIE, DEMO_SUMMARY } from "@/lib/demo";
import type { BannerSetting, GuestbookEntry, MySummary, Photo } from "@/lib/types";

export type HomeData = {
  authed: boolean;
  summary: MySummary | null;
  guestbook: GuestbookEntry[];
  banner: BannerSetting | null;
  galleryOpen: boolean;
  guestbookOpen: boolean;
  photos: Photo[];
  /** Supabase 미설정 + 미리보기 쿠키 → 가짜 세션으로 로그인 후 화면 표시 */
  demoMode: boolean;
};

export async function getHomeData(demoOverride = false): Promise<HomeData> {
  const data: HomeData = {
    authed: false,
    summary: null,
    guestbook: [],
    banner: null,
    galleryOpen: false,
    guestbookOpen: true,
    photos: [],
    demoMode: false,
  };

  const supabase = await getSupabaseServer();

  if (!supabase) {
    // 목업 모드 — env 설정 전. 데모 방명록 + (쿠키 또는 ?demo=1이면) 미리보기 로그인
    data.guestbook = GUESTBOOK_FALLBACK;
    const cookieStore = await cookies();
    if (
      !isSupabaseConfigured() &&
      (demoOverride || cookieStore.get(DEMO_COOKIE))
    ) {
      data.demoMode = true;
      data.authed = true;
      data.summary = DEMO_SUMMARY;
      data.galleryOpen = true;
    }
    return data;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  data.authed = Boolean(user);

  const [gbRes, settingsRes] = await Promise.all([
    supabase
      .from("guestbook")
      .select("id,display_name,content,created_at,participant_id")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("site_settings").select("key,value"),
  ]);
  data.guestbook = (gbRes.data as GuestbookEntry[]) ?? [];

  const settings = parseSiteSettings(settingsRes.data);
  data.banner = settings.banner.visible ? settings.banner : null;
  data.galleryOpen = settings.galleryOpen;
  data.guestbookOpen = settings.guestbookOpen;

  if (user) {
    const { data: summary } = await supabase.rpc("get_my_summary");
    data.summary = summary as MySummary | null;

    if (data.galleryOpen && data.summary) {
      const { data: photos } = await supabase
        .from("photos")
        .select("id,participant_id,cloudinary_public_id,width,height,created_at")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(24);
      data.photos = (photos as Photo[]) ?? [];
    }
  }

  return data;
}
