import { NextResponse } from "next/server";
import { getAdminContext, isAdminPreview } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { demoJoinRequests } from "@/lib/demo";

/** 대기 중인 가입 요청 — 가입 승인 화면이 폴링으로 읽는다 */
export async function GET() {
  // 목업 단계 — 가입 승인 미리보기용 예시 요청
  if (isAdminPreview() || !isSupabaseConfigured())
    return NextResponse.json(demoJoinRequests());

  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await ctx.supabase.rpc("admin_join_requests", {
    p_status: "pending",
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
