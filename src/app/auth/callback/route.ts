import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/** 소셜 로그인 OAuth 콜백 — 세션 교환 후 바인딩 여부에 따라 분기 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) next = "/";

  const supabase = await getSupabaseServer();
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.rpc("get_my_summary");
      if (!data) return NextResponse.redirect(`${origin}/bind`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
