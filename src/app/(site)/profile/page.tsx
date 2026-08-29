import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import ConnectPrompt from "@/components/profile/ConnectPrompt";
import PendingCard from "@/components/profile/PendingCard";
import PreviewNotice from "@/components/profile/PreviewNotice";
import WordCard from "@/components/profile/WordCard";
import WordcardSave from "@/components/profile/WordcardSave";
import RoomCard from "@/components/profile/RoomCard";
import TeamCard from "@/components/profile/TeamCard";
import QrCard from "@/components/profile/QrCard";
import { MY_PREVIEW } from "@/lib/demo";
import { getSiteContext } from "@/lib/data/site";

export const metadata: Metadata = { title: "내 정보 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // ?demo=1 — 목업 단계에서 로그인 후 화면을 바로 보는 미리보기 링크
  const { demo } = await searchParams;
  const ctx = await getSiteContext(demo === "1");
  const summary = ctx.summary;

  // 비로그인 방문자에게는 예시 화면을 보여준다 — 잠긴 화면만 띄우면
  // "로그인하면 뭐가 나오는지"를 알 수 없어 연결까지 가지 않는다.
  if (!ctx.authed) {
    return (
      <section id="my">
        <div className="container">
          <PageHead title="내 정보" />
          <PreviewNotice />
          <div className="reveal" aria-hidden="true">
            <WordCard name={MY_PREVIEW.name} />
            <RoomCard room={MY_PREVIEW.room} mates={MY_PREVIEW.mates} />
            <TeamCard team={MY_PREVIEW.team} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="my">
      <div className="container">
        <PageHead title="내 정보" />
        {!summary ? (
          <ConnectPrompt />
        ) : summary.status !== "approved" ? (
          <PendingCard summary={summary} />
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
