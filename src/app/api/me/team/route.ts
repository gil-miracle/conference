import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { MySummary } from "@/lib/types";

/**
 * 우리 조 이름들 — 나눔 순서 정하기에서 「우리 조 불러오기」가 쓴다.
 *
 * 내 정보 요약(get_my_summary)이 이미 조원 이름을 내려준다. 승인된 본인에게만,
 * 조 공개 스위치가 켜졌을 때만 온다 — 그 판정을 여기서 다시 하지 않는다.
 * 이름 말고는 아무것도 내려주지 않는다.
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ names: null, reason: "unavailable" });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ names: null, reason: "unauthenticated" }, { status: 401 });

  const { data } = await supabase.rpc("get_my_summary");
  const my = data as MySummary | null;
  const headers = { "Cache-Control": "no-store" };

  if (!my || my.status !== "approved")
    return NextResponse.json({ names: null, reason: "not_approved" }, { headers });
  if (my.teams_open !== true)
    return NextResponse.json({ names: null, reason: "not_open" }, { headers });
  if (!my.team) return NextResponse.json({ names: null, reason: "no_team" }, { headers });

  // 옛 모양(문자열)과 새 모양({name,...})이 잠시 섞여 올 수 있다 — MySummary 참고
  const names = (my.team.members ?? [])
    .map((m) => (typeof m === "string" ? m : m.name))
    .filter(Boolean);

  return NextResponse.json({ names, team: my.team.name }, { headers });
}
