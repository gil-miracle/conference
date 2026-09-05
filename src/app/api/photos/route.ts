import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

const PAGE = 200;

/** 갤러리 페이지네이션 — RLS가 로그인·오픈 여부를 걸러준다 */
export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json([], { status: 200 });

  const before = new URL(request.url).searchParams.get("before");

  let query = supabase
    .from("photos")
    .select("id,participant_id,cloudinary_public_id,width,height,created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(PAGE);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
