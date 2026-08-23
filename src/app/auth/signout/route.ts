import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/demo";

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
  // 미리보기(데모) 세션도 함께 종료
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
