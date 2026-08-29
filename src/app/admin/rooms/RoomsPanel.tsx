"use client";

import { useState } from "react";
import { groupByAssignment } from "@/lib/assignment";
import { INVITED, groupTag } from "@/lib/format";
import { isStaff } from "@/lib/participant-fields";
import {
  ROOM_GENDERS,
  type AdminRoom,
  type PersonLite,
  type RoomHold,
} from "@/lib/types";
import RoomEditor from "./RoomEditor";
import RoomFill from "./RoomFill";
import RoomPicker from "./RoomPicker";

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
 * 숙소 배정.
 *
 * 위에서 아래로 방을 만들고 → 방을 채우고 → 아직 안 들어간 사람을 본다.
 * 미배정은 칩으로만 늘어놓는다 — 한 명씩 셀렉트를 고르는 대신 방 쪽에서
 * 여러 명을 한 번에 넣는 편이 쉰 명 넘는 명단에서 훨씬 빠르다.
 *
 * 미배정은 다락방으로 묶는다. 같은 다락방끼리 한 방에 넣는 일이 많아,
 * 이름만 죽 늘어놓으면 매번 눈으로 골라내야 한다.
 *
 * 방을 만들고 고치고 지우는 일은 RoomEditor가, 사람을 넣고 빼는 일은
 * RoomFill이 맡는다.
 *
 * 방이 스무 개를 넘으면 "여자 방 중 빈자리 있는 데"를 눈으로 찾게 된다 —
 * 성별과 빈자리로 걸러낸다.
 */
export default function RoomsPanel({
  rooms,
  people,
  holds,
}: {
  rooms: AdminRoom[];
  people: PersonLite[];
  holds: RoomHold[];
}) {
  const [gender, setGender] = useState("");
  const [space, setSpace] = useState("");
  const [pickFor, setPickFor] = useState<PersonLite | null>(null);
  const { membersOf, unassigned } = groupByAssignment(people, "room_id");
  /* 자리 채움도 한 칸을 차지한다 — 정원 계산에는 사람과 같이 센다 */
  const holdsOf = (roomId: string) => holds.filter((h) => h.room_id === roomId);
  const usedOf = (roomId: string) => membersOf(roomId).length + holdsOf(roomId).length;
  const usedCount = rooms.filter((room) => usedOf(room.id) > 0).length;

  const shown = rooms.filter((room) => {
    if (gender && room.gender !== gender) return false;
    if (!space) return true;
    const left = room.capacity - usedOf(room.id);
    return space === "open" ? left > 0 : left <= 0;
  });

  /* 성별 조건은 미배정 목록에도 건다 — "여자 방 채우는 중"이면 아래도 여자만
     보여야 한다. 기타 방은 남녀를 다 받으므로 아래도 가리지 않는다 */
  const left = unassigned.filter(
    (p) => !gender || gender === "기타" || p.gender === gender
  );

  return (
    <>
      <div className="sec-title">
        <b>숙소 배정</b>
        <span>
          {usedCount}/{rooms.length} ROOMS
        </span>
      </div>

      <RoomEditor />

      <div className="filters">
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">성별 전체</option>
          {ROOM_GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={space} onChange={(e) => setSpace(e.target.value)}>
          <option value="">자리 전체</option>
          <option value="open">빈자리 있음</option>
          <option value="full">다 참</option>
        </select>
        <span className="fcount">
          {rooms.length}개 중 {shown.length}개
        </span>
      </div>

      {shown.length === 0 && rooms.length > 0 && (
        <p className="hint-sm">조건에 맞는 방이 없어요.</p>
      )}

      {shown.map((room) => {
        const members = membersOf(room.id);
        return (
          <div className="room" key={room.id}>
            {/* 제목을 누르면 방 정보를 고친다 — 삭제도 그 안에 있다 */}
            <RoomEditor room={room} memberCount={usedOf(room.id)} />
            <div className="members">
              <RoomFill
                roomId={room.id}
                roomLabel={`${room.building} ${room.room_no} · ${room.gender}`}
                roomGender={room.gender}
                capacity={room.capacity}
                people={unassigned}
                members={members}
                holds={holdsOf(room.id)}
                leaderId={room.leader_id}
              />
            </div>
          </div>
        );
      })}

      <div className="unassigned">
        <div className="eyebrow">
          숙소 미배정 · {left.length}명
          {gender && unassigned.length !== left.length && ` (전체 ${unassigned.length}명)`}
        </div>
        {left.length === 0 ? (
          <p className="hint-sm">
            {unassigned.length === 0 ? "전원 배정 완료." : "조건에 맞는 사람이 없어요."}
          </p>
        ) : (
          byGroup(left).map(([group, list]) => (
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

      <RoomPicker
        person={pickFor}
        rooms={rooms}
        countOf={usedOf}
        onClose={() => setPickFor(null)}
      />
    </>
  );
}
