"use client";

import { useState } from "react";
import { groupByAssignment } from "@/lib/assignment";
import { INVITED, groupTag } from "@/lib/format";
import { isStaff } from "@/lib/participant-fields";
import type { AdminTeam, PersonLite } from "@/lib/types";
import TeamEditor from "./TeamEditor";
import TeamFill from "./TeamFill";
import TeamPicker from "./TeamPicker";

/** 다락방이 먼저, 그다음 초청자, 교역자·멘토, 나머지 */
const RANK = (key: string) =>
  key === INVITED ? 1 : isStaff(key) ? 2 : key === "기타" ? 3 : 0;

function byGroup(people: PersonLite[]) {
  const map = new Map<string, PersonLite[]>();
  for (const person of people) {
    const key = groupTag(person) ?? "기타";
    map.set(key, [...(map.get(key) ?? []), person]);
  }
  return [...map.entries()].sort(
    ([a], [b]) => RANK(a) - RANK(b) || a.localeCompare(b)
  );
}

/**
 * 게임 조 배정 — 숙소 배정과 같은 구조.
 *
 * 조를 만들고 → 조를 채우고 → 아직 안 들어간 사람을 본다. 다른 점은 조에
 * 정원도 성별도 없다는 것뿐이라, 빈 자리 칸도 성별 조건도 없다.
 */
export default function TeamsPanel({
  teams,
  people,
}: {
  teams: AdminTeam[];
  people: PersonLite[];
}) {
  const [pickFor, setPickFor] = useState<PersonLite | null>(null);
  const { membersOf, unassigned } = groupByAssignment(people, "team_id");
  const nameOf = (id: string | null) =>
    id ? people.find((p) => p.id === id)?.name ?? null : null;

  return (
    <>
      <div className="sec-title">
        <b>게임 조 배정</b>
      </div>

      <TeamEditor />

      {teams.map((team) => {
        const members = membersOf(team.id);
        return (
          <div className="room" key={team.id}>
            <TeamEditor
              team={team}
              memberCount={members.length}
              leaderName={nameOf(team.leader_id) ?? team.leader}
            />
            <div className="members">
              <TeamFill
                teamId={team.id}
                teamName={team.name}
                people={unassigned}
                members={members}
                leaderId={team.leader_id}
              />
            </div>
          </div>
        );
      })}

      <div className="unassigned">
        <div className="eyebrow">조 미배정 · {unassigned.length}명</div>
        {unassigned.length === 0 ? (
          <p className="hint-sm">전원 배정 완료.</p>
        ) : (
          byGroup(unassigned).map(([group, list]) => (
            <div className="un-group" key={group}>
              <small>
                {group} · {list.length}명
              </small>
              <div className="members">
                {list.map((person) => (
                  <button
                    type="button"
                    className="mchip"
                    key={person.id}
                    data-g={person.gender ?? ""}
                    onClick={() => setPickFor(person)}
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <TeamPicker
        person={pickFor}
        teams={teams}
        countOf={(id) => membersOf(id).length}
        onClose={() => setPickFor(null)}
      />
    </>
  );
}
