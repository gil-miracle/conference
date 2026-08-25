import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import MyLocked from "@/components/my/MyLocked";
import MyBindPrompt from "@/components/my/MyBindPrompt";
import MyPendingCard from "@/components/my/MyPendingCard";
import WordCard from "@/components/my/WordCard";
import WordcardSave from "@/components/my/WordcardSave";
import RoomCard from "@/components/my/RoomCard";
import TeamCard from "@/components/my/TeamCard";
import QrCard from "@/components/my/QrCard";
import { getSiteContext } from "@/lib/data/site";

export const metadata: Metadata = { title: "내 정보 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // ?demo=1 — 목업 단계에서 로그인 후 화면을 바로 보는 미리보기 링크
  const { demo } = await searchParams;
  const ctx = await getSiteContext(demo === "1");
  const summary = ctx.summary;

  return (
    <section id="my">
      <div className="container">
        <PageHead title="내 정보" idx="MY — 참가자 전용" />
        {!ctx.authed ? (
          <MyLocked />
        ) : !summary ? (
          <MyBindPrompt />
        ) : summary.status !== "approved" ? (
          <MyPendingCard summary={summary} />
        ) : (
          <div className="reveal">
            <WordCard name={summary.name} />
            <WordcardSave name={summary.name} />
            {summary.rooms_open && (
              <>
                <RoomCard room={summary.room} mates={summary.mates} />
                <TeamCard team={summary.team} />
              </>
            )}
            {summary.checkin_token && (
              <QrCard
                token={summary.checkin_token}
                checkedInAt={summary.checked_in_at}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
