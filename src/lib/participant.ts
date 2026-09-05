import { getSupabaseServer } from "./supabase/server";

/**
 * 참가자 액션용 가드 — 세션 + 명단 바인딩까지 확인.
 * (관리자 쪽 getAdminContext의 참가자 대응물)
 * 미설정·미로그인·미바인딩이면 null.
 */
export async function getBoundParticipant() {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("participants")
    .select("id,name,role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!me) return null;

  return { supabase, me };
}
