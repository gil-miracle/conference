import type { MySummary } from "@/lib/types";

export default function TeamCard({ team }: { team: MySummary["team"] }) {
  return (
    <div className="my-card">
      <div className="eyebrow">MY TEAM</div>
      {team ? (
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
