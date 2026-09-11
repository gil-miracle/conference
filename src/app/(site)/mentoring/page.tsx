import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { TabIcon } from "@/components/nav/TabIcons";
import { NEED_BIND, NEED_LOGIN } from "@/lib/messages";
import { getSiteContext, hasAuthCookie } from "@/lib/data/site";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { MentorBoard } from "@/lib/mentoring";
import MentorPicker from "@/components/mentoring/MentorPicker";

export const metadata: Metadata = { title: "멘토의 TMI — MIRACLE 2026" };
export const dynamic = "force-dynamic";

const EMPTY_BOARD: MentorBoard = { mine: null, sessions: [] };

/**
 * 보드는 세션 확인과 **같이** 던진다. 세션 답을 기다렸다 던지면 Supabase
 * 왕복이 둘로 늘고, 로그인한 사람은 그만큼 화면을 더 기다린다. 로그인
 * 쿠키가 없으면 묻지 않는다 — RPC가 어차피 빈 것을 주지만 왕복은 왕복이다.
 */
async function loadBoard(): Promise<MentorBoard> {
  if (!(await hasAuthCookie())) return EMPTY_BOARD;
  const supabase = await getSupabaseServer();
  const { data } = (await supabase?.rpc("mentor_board")) ?? { data: null };
  return (data as MentorBoard | null) ?? EMPTY_BOARD;
}

/**
 * 멘토의 TMI — 신청.
 *
 * 세션은 한 타임에 다 열리므로 한 사람이 하나만 듣는다. 다른 카드를 누르면
 * 옮겨간다 — 취소하고 다시 신청하는 게 아니라 한 번에 옮긴다.
 */
export default async function MentoringPage() {
  const [ctx, loaded] = await Promise.all([getSiteContext(), loadBoard()]);
  const board = ctx.authed ? loaded : EMPTY_BOARD;

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
              ? "길 공동체 멤버십에게만 공개되는 특별한 시간, 멘토님들의 Too Meaningful Information!\n한 분을 골라 신청해주세요."
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
