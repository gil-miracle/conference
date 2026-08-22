import SectionHead from "@/components/SectionHead";
import MyLocked from "@/components/my/MyLocked";
import MyBindPrompt from "@/components/my/MyBindPrompt";
import WordCard from "@/components/my/WordCard";
import WordcardSave from "@/components/my/WordcardSave";
import RoomCard from "@/components/my/RoomCard";
import TeamCard from "@/components/my/TeamCard";
import QrCard from "@/components/my/QrCard";
import type { MySummary } from "@/lib/types";

export default function MySection({
  authed,
  summary,
}: {
  authed: boolean;
  summary: MySummary | null;
}) {
  return (
    <section id="my">
      <div className="container">
        <SectionHead title="내 정보" idx="MY — 참가자 전용" />
        {!authed ? (
          <MyLocked />
        ) : !summary ? (
          <MyBindPrompt />
        ) : (
          <div className="reveal">
            <WordCard name={summary.name} />
            <WordcardSave name={summary.name} />
            <RoomCard room={summary.room} mates={summary.mates} />
            <TeamCard team={summary.team} />
            <QrCard
              token={summary.checkin_token}
              checkedInAt={summary.checked_in_at}
            />
          </div>
        )}
      </div>
    </section>
  );
}
