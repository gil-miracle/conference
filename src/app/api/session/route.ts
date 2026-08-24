import { NextResponse } from "next/server";
import { getSiteContext } from "@/lib/data/site";

/**
 * 레이아웃이 정적으로 남을 수 있도록 세션·배너만 따로 내려주는 경량 엔드포인트.
 * 개인정보는 담지 않는다(이름·연락처 없음).
 */
export async function GET() {
  const ctx = await getSiteContext();
  return NextResponse.json(
    {
      authed: ctx.authed,
      bound: ctx.summary?.status === "approved",
      isAdmin: ctx.summary?.role === "admin",
      banner: ctx.banner,
      demoMode: ctx.demoMode,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
