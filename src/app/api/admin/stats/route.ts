import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { demoAdminStats } from "@/lib/demo";

export async function GET() {
  // 목업 단계 — 대시보드 미리보기용 데모 통계
  if (!isSupabaseConfigured()) return NextResponse.json(demoAdminStats());

  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await ctx.supabase.rpc("admin_stats");
  if (error || !data)
    return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json(data);
}
