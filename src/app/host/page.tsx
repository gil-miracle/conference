import { redirect } from "next/navigation";
import { getHostContext } from "@/lib/admin";
import type { AdminTeam } from "@/lib/types";
import type { Bonus, Game, GameScore, Standing } from "@/lib/game-types";
import HostBoard from "./HostBoard";

export const dynamic = "force-dynamic";

/**
 * 진행자 화면.
 *
 * 관리자 화면과 나눈 이유는 자리가 다르기 때문이다 — 진행자는 사회를 보면서
 * 한 손으로 점수를 넣는다. 명단·숙소·승인이 들어찬 화면은 그때 방해만 된다.
 * 여기는 점수와 순위만 있다.
 */
export default async function HostPage() {
  const ctx = await getHostContext();
  if (!ctx) redirect("/");

  const [gamesRes, teamsRes, scoresRes, bonusRes, standingsRes] = await Promise.all([
    ctx.supabase.from("games").select("id,name,host_id,note,sort_order").order("sort_order"),
    ctx.supabase.from("teams").select("id,name,leader,leader_id").order("name"),
    ctx.supabase.from("game_scores").select("game_id,team_id,points"),
    ctx.supabase
      .from("bonus_points")
      .select("id,team_id,points,reason,created_at")
      .order("created_at", { ascending: false }),
    ctx.supabase.rpc("team_standings"),
  ]);

  return (
    <HostBoard
      games={(gamesRes.data ?? []) as Game[]}
      teams={(teamsRes.data ?? []) as AdminTeam[]}
      scores={(scoresRes.data ?? []) as GameScore[]}
      bonuses={(bonusRes.data ?? []) as Bonus[]}
      standings={(standingsRes.data ?? []) as Standing[]}
    />
  );
}
