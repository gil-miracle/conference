import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_KEY, isSupabaseConfigured } from "./server";

/**
 * 공개 데이터 전용 클라이언트 — **쿠키를 읽지 않는다.**
 *
 * 이게 왜 따로 필요한가:
 * getSupabaseServer()는 세션을 붙이려고 cookies()를 호출하는데, Next는 그 순간
 * 해당 라우트를 동적으로 확정한다. 그러면 `export const revalidate`가 무력해지고
 * 정적 프리렌더·prefetch가 통째로 날아간다 — 메뉴 이동마다 서버 왕복이 생긴다.
 *
 * 방명록·송리스트·사이트 설정은 RLS가 이미 "누구나 읽기"로 열어둔 데이터라
 * 세션이 필요 없다. 로그인하지 않은 클라이언트로 읽으면
 *   · guestbook  → not hidden 인 글만
 *   · song_sets/songs, site_settings → 전부 (select using (true))
 * 로 정확히 공개 화면이 필요한 만큼만 내려온다.
 *
 * 개인화가 필요한 조회(/my, /gallery)는 반드시 getSupabaseServer()를 쓸 것.
 */
export function getSupabaseAnon() {
  if (!isSupabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
