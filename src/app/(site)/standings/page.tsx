import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { TabIcon } from "@/components/nav/TabIcons";
import { getSiteContext } from "@/lib/data/site";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getHostContext } from "@/lib/admin";
import type { Standing } from "@/lib/game-types";

export const metadata: Metadata = { title: "조 점수 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

/**
 * 조 점수 — 참가자가 보는 순위.
 *
 * 점수를 처음부터 다 보여주면 김이 샌다. 설정의 스위치(scores_open)가 켜져야
 * 참가자에게 보이고, 진행자와 관리자는 늘 본다.
 */
export default async function StandingsPage() {
  const ctx = await getSiteContext();
  const host = await getHostContext();
  const canSee = ctx.scoresOpen || Boolean(host);

  let standings: Standing[] = [];
  if (ctx.authed && canSee) {
    const supabase = await getSupabaseServer();
    const { data } = (await supabase?.rpc("team_standings")) ?? { data: null };
    standings = (data ?? []) as Standing[];
  }

  return (
    <section id="standings">
      <div className="container">
        <PageHead title="조 점수" lede="게임과 가산점을 더한 지금 순위예요." />

        {!ctx.authed ? (
          <Locked icon={<TabIcon name="user" />} showLogin>
            로그인하면 우리 조 점수를 볼 수 있어요.
          </Locked>
        ) : !canSee ? (
          <Locked icon={<TabIcon name="clock" />}>
            아직 공개 전이에요. 레크리에이션이 시작되면 열려요.
          </Locked>
        ) : standings.length === 0 ? (
          <p className="lede">아직 조가 없어요.</p>
        ) : (
          <ol className="rank reveal">
            {standings.map((s, i) => (
              <li key={s.id} className={i === 0 && s.total > 0 ? "top" : ""}>
                <span className="n">{i + 1}</span>
                <b>{s.name}</b>
                <em>
                  {s.total}
                  {s.bonus_total > 0 && <i>가산 {s.bonus_total}</i>}
                </em>
              </li>
            ))}
          </ol>
        )}

        {host && !ctx.scoresOpen && (
          <p className="hint-sm mt-14">
            공개 전이라 참가자에게는 아직 보이지 않아요. 설정에서 켜면 열립니다.
          </p>
        )}
      </div>
    </section>
  );
}
