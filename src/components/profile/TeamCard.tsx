import MateList from "@/components/profile/MateList";
import type { MySummary } from "@/lib/types";

export default function TeamCard({
  team,
  open,
}: {
  team: MySummary["team"];
  /** 관리자가 숙소·조를 공개했는가 */
  open: boolean;
}) {
  return (
    <div className="my-card">
      <div className="eyebrow">조</div>
      {!open ? (
        <h3 className="tbd">아직 공개 전이에요</h3>
      ) : team ? (
        <>
          <h3>{team.name}</h3>
          {/* 조장 이름은 아래 목록에 표가 붙으므로 여기서는 뺀다 */}
          <small>{team.note || "함께 뛰는 우리 조"}</small>
          <MateList people={team.members ?? []} leaderLabel="조장" />
        </>
      ) : (
        <>
          <h3>배정 전</h3>
          <small>조가 배정되면 여기에 보여요.</small>
        </>
      )}
    </div>
  );
}
