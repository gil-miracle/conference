import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { TabIcon } from "@/components/nav/TabIcons";
import { getSiteContext } from "@/lib/data/site";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { MentorBoard } from "@/lib/mentoring";
import MentorPicker from "@/components/mentoring/MentorPicker";

export const metadata: Metadata = { title: "멘토의 TMI — MIRACLE 2026" };
export const dynamic = "force-dynamic";

/**
 * 멘토의 TMI — 신청.
 *
 * 세션은 한 타임에 다 열리므로 한 사람이 하나만 듣는다. 다른 카드를 누르면
 * 옮겨간다 — 취소하고 다시 신청하는 게 아니라 한 번에 옮긴다.
 */
export default async function MentoringPage() {
  const ctx = await getSiteContext();

  let board: MentorBoard = { mine: null, sessions: [] };
  if (ctx.authed) {
    const supabase = await getSupabaseServer();
    const { data } = (await supabase?.rpc("mentor_board")) ?? { data: null };
    if (data) board = data as MentorBoard;
  }

  const bound = Boolean(ctx.summary);

  return (
    <section id="mentoring">
      <div className="container">
        <PageHead
          title="멘토의 TMI"
          lede="한 분을 골라 신청해주세요. 세션 전날까지는 바꿀 수 있어요."
        />

        {!ctx.authed ? (
          <Locked icon={<TabIcon name="user" />} showLogin>
            로그인하면 신청할 수 있어요.
          </Locked>
        ) : !bound ? (
          <Locked icon={<TabIcon name="user" />} showBind>
            신청 명단과 연결하면 신청할 수 있어요.
          </Locked>
        ) : board.sessions.length === 0 ? (
          <p className="lede">아직 열린 세션이 없어요. 곧 올라옵니다.</p>
        ) : (
          <MentorPicker board={board} />
        )}
      </div>
    </section>
  );
}
