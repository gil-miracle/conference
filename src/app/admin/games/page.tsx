import { requireAdmin } from "@/lib/admin";
import type { AdminParticipant } from "@/lib/types";
import type { Game } from "@/lib/game-types";
import GamesPanel from "./GamesPanel";

export const dynamic = "force-dynamic";

/**
 * 게임 만들기 — 관리자.
 *
 * 점수는 여기서 넣지 않는다. 만드는 자리와 쓰는 자리를 나눠야, 사회를 보며
 * 점수를 넣는 사람이 실수로 게임을 지우는 일이 없다.
 */
export default async function AdminGamesPage() {
  const ctx = await requireAdmin();

  let games: Game[] = [];
  let people: Pick<AdminParticipant, "id" | "name">[] = [];

  if (!ctx.demo) {
    const [gamesRes, peopleRes] = await Promise.all([
      ctx.supabase
        .from("games")
        .select("id,name,host_id,note,sort_order")
        .order("sort_order"),
      ctx.supabase.from("participants").select("id,name").order("name"),
    ]);
    games = (gamesRes.data ?? []) as Game[];
    people = (peopleRes.data ?? []) as Pick<AdminParticipant, "id" | "name">[];
  }

  return <GamesPanel games={games} people={people} />;
}
