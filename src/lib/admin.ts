import { redirect } from "next/navigation";
import { getSupabaseServer, isSupabaseConfigured } from "./supabase/server";

type Supabase = NonNullable<Awaited<ReturnType<typeof getSupabaseServer>>>;

export type AdminCtx =
  | { demo: false; supabase: Supabase; me: { id: string; name: string; role: string } }
  | { demo: true; me: { name: string } };

/**
 * 관리자 페이지용 가드.
 * - Supabase 미설정(목업 단계): 데모 컨텍스트 반환 → 화면 미리보기 허용
 * - 설정됨: admin 참가자만 통과, 아니면 홈으로
 */
export async function requireAdmin(): Promise<AdminCtx> {
  if (!isSupabaseConfigured()) return { demo: true, me: { name: "김예찬" } };

  const ctx = await getAdminContext();
  if (!ctx) redirect("/");
  return { demo: false, ...ctx };
}

/** 액션/API용 — 실제 admin 세션만. 데모·미설정·비admin이면 null (변경 차단) */
export async function getAdminContext() {
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
  if (!me || me.role !== "admin") return null;
  return { supabase, me };
}
