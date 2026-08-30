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
      <div className="eyebrow">MY TEAM</div>
      {!open ? (
        <>
          <h3 className="tbd">미정</h3>
          <small>배정이 끝나면 여기에 열려요.</small>
        </>
      ) : team ? (
        <>
          <h3>{team.name}</h3>
          <small>
            {[team.leader ? `조장 ${team.leader}` : null, team.note]
              .filter(Boolean)
              .join(" · ") || "함께 뛰는 우리 조"}
          </small>
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
