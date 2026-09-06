import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { TabIcon } from "@/components/nav/TabIcons";
import { NEED_BIND, NEED_LOGIN } from "@/lib/messages";
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
        {/* 안내 문구도 로그인 뒤에 — 들어오지도 못하는 사람에게 고르라고
            할 이유가 없다.
            바꿀 수 있다는 말은 빼 두었다. 카드에 「신청함 · 취소」가 이미
            있어서, 읽기 전에 이미 아는 것을 한 줄 더 읽게 된다 */}
        <PageHead
          title="멘토의 TMI"
          lede={
            ctx.authed
              ? "먼저 걸어가신 분들이 여기서만 꺼내는 이야기예요.\n한 분을 골라 신청해주세요."
              : undefined
          }
        />

        {!ctx.authed ? (
          <Locked icon={<TabIcon name="user" />} showLogin>
            {NEED_LOGIN}
          </Locked>
        ) : !bound ? (
          <Locked icon={<TabIcon name="user" />} showBind>
            {NEED_BIND}
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
