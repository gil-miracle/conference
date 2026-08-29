import { autoAssignTeams, createTeam } from "../actions/teams";
import { groupByAssignment } from "@/lib/assignment";
import type { AdminTeam, PersonLite } from "@/lib/types";
import AssignSelect from "../rooms/AssignSelect";
import DeleteButton from "../rooms/DeleteButton";

/** 게임 조 배정 — 조 목록 + 조 추가 + 미배정 배정 + 자동 배정 */
export default function TeamsPanel({
  teams,
  people,
}: {
  teams: AdminTeam[];
  people: PersonLite[];
}) {
  const { membersOf, unassigned } = groupByAssignment(people, "team_id");
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  return (
    <>
      <div className="sec-title mt-38">
        <b>게임 조 배정</b>
        <span>OPTIONAL</span>
      </div>

      {teams.map((team) => {
        const members = membersOf(team.id);
        return (
          <div className="room" key={team.id}>
            <div className="top">
              <b>{team.name}</b>
              <span className="cap">
                {members.length}명{team.leader ? ` · 조장 ${team.leader}` : ""}
                {members.length === 0 && (
                  <DeleteButton kind="team" id={team.id} />
                )}
              </span>
            </div>
            {members.length > 0 && (
              <div className="members">
                {members.map((member) => (
                  <span key={member.id}>{member.name}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <form className="inline-form" action={createTeam}>
        <input name="name" placeholder="조 이름 (오렌지조)" required />
        <input name="leader" placeholder="조장 (선택)" />
        <button className="btn sm ghost">조 추가</button>
      </form>

      {unassigned.length > 0 && teams.length > 0 && (
        <div className="unassigned">
          <div className="eyebrow">조 미배정 · {unassigned.length}명</div>
          {unassigned.map((person) => (
            <div className="assign-row" key={person.id}>
              <b>{person.name}</b>
              <AssignSelect
                kind="team"
                participantId={person.id}
                options={teamOptions}
              />
            </div>
          ))}
        </div>
      )}

      {teams.length > 0 && (
        <form action={autoAssignTeams}>
          <button className="btn full-w mt-14">
            미배정 인원 자동 배정 ({unassigned.length}명)
          </button>
        </form>
      )}
    </>
  );
}
