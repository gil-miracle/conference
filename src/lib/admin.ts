import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer, isSupabaseConfigured } from "./supabase/server";

type Supabase = NonNullable<Awaited<ReturnType<typeof getSupabaseServer>>>;

export type AdminMe = {
  id: string;
  name: string;
  role: string;
  /** 레크리에이션 점수를 넣을 수 있는가 — 역할과 독립이다 */
  is_host: boolean;
};

export type AdminCtx =
  | { demo: false; supabase: Supabase; me: AdminMe }
  | { demo: true; me: { name: string } };

/**
 * 관리자 페이지용 가드.
 * - Supabase 미설정(목업 단계): 데모 컨텍스트 반환 → 화면 미리보기 허용
 * - 설정됨: admin 참가자만 통과, 아니면 홈으로
 */
/**
 * 개발 중 관리자 화면을 훑어보기 위한 우회 플래그.
 * NODE_ENV가 production이면 무조건 꺼지므로 배포본에는 영향이 없다.
 * (실제 DB 데이터는 RLS가 auth.uid() 기준이라 어차피 보이지 않으므로,
 *  우회 시에는 데모 데이터를 보여준다)
 */
export function isAdminPreview() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ADMIN_DEV_PREVIEW === "1"
  );
}

export async function requireAdmin(): Promise<AdminCtx> {
  if (isAdminPreview() || !isSupabaseConfigured())
    return { demo: true, me: { name: "김예찬" } };

  const ctx = await getAdminContext();
  if (!ctx) redirect("/");
  return { demo: false, ...ctx };
}

/**
 * 액션/API용 — 실제 admin 세션만. 데모·미설정·비admin이면 null (변경 차단).
 *
 * React cache로 감싼다. 레이아웃과 페이지가 각각 requireAdmin을 부르는데,
 * 감싸지 않으면 화면 하나 여는 데 세션 확인 + 권한 조회가 두 벌씩 나간다
 * (사이트 쪽 loadContext가 같은 이유로 이미 감싸여 있다).
 */
export const getAdminContext = cache(async () => {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  // 세션 확인과 권한 조회를 한 번에 묻는다. auth.uid()는 PostgREST가 검증한
  // JWT에서 나오므로 따로 getUser()를 부를 필요가 없다.
  const { data } = await supabase.rpc("admin_me");
  const me = data as AdminMe | null;
  if (!me || me.role !== "admin") return null;
  return { supabase, me };
});

/**
 * 진행자 화면용 가드 — 진행자로 지정된 사람과 관리자.
 *
 * 관리자를 따로 확인하지 않는다. is_host가 이미 관리자를 통과시키고, 두 곳에서
 * 각각 판단하면 언젠가 갈라진다.
 */
export const getHostContext = cache(async () => {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase.rpc("admin_me");
  const me = data as AdminMe | null;
  if (!me || (me.role !== "admin" && !me.is_host)) return null;
  return { supabase, me };
});
