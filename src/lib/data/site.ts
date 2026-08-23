import { cache } from "react";
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

/** 미리보기 쿠키 여부 (env 미설정일 때만 유효) */
async function hasDemoCookie() {
  if (isSupabaseConfigured()) return false;
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(DEMO_COOKIE));
}

/**
 * 세션·설정 조회. React cache로 감싸 한 요청 안에서는 한 번만 실행된다
 * (레이아웃과 페이지가 각각 호출해도 DB 왕복은 1회).
 */
const loadContext = cache(async (): Promise<SiteContext> => {
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
    if (await hasDemoCookie()) {
      ctx.demoMode = true;
      ctx.authed = true;
      ctx.summary = DEMO_SUMMARY;
      ctx.galleryOpen = true;
    }
    return ctx;
  }

  // 세션과 사이트 설정은 서로 독립 — 병렬로 받아 왕복을 줄인다
  const [userRes, settingsRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("site_settings").select("key,value"),
  ]);
  const user = userRes.data.user;
  ctx.authed = Boolean(user);

  const settings = parseSiteSettings(settingsRes.data);
  ctx.banner = settings.banner.visible ? settings.banner : null;
  ctx.galleryOpen = settings.galleryOpen;
  ctx.guestbookOpen = settings.guestbookOpen;

  if (user) {
    const { data: summary } = await supabase.rpc("get_my_summary");
    ctx.summary = summary as MySummary | null;
  }
  return ctx;
});

/**
 * `?demo=1`은 목업 모드에서 로그인 후 화면을 바로 보기 위한 편의 기능.
 * 캐시된 결과 위에 메모리에서만 덧씌워 추가 왕복을 만들지 않는다.
 */
export async function getSiteContext(demoOverride = false): Promise<SiteContext> {
  const ctx = await loadContext();
  if (demoOverride && !isSupabaseConfigured() && !ctx.demoMode) {
    return {
      ...ctx,
      demoMode: true,
      authed: true,
      summary: DEMO_SUMMARY,
      galleryOpen: true,
    };
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
