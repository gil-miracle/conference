import { NextResponse } from "next/server";
import { getSiteContext } from "@/lib/data/site";

/**
 * 레이아웃이 정적으로 남을 수 있도록 세션·배너만 따로 내려주는 경량 엔드포인트.
 * 개인정보는 담지 않는다 — 이름·연락처 없이 불리언과 본인 id뿐.
 * participantId는 "이 글이 내 글인가" 같은 소유자 판정에 쓴다
 * (방명록 행에 participant_id가 이미 공개로 실려 있어 새 노출은 아니다).
 */
export async function GET() {
  const ctx = await getSiteContext();
  return NextResponse.json(
    {
      authed: ctx.authed,
      bound: ctx.summary?.status === "approved",
      participantId:
        ctx.summary?.status === "approved" ? ctx.summary.id : null,
      isAdmin: ctx.summary?.role === "admin",
      banner: ctx.banner,
      menus: ctx.menus,
      demoMode: ctx.demoMode,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
