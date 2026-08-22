import { createRoom } from "../actions/rooms";
import type { AdminRoom, PersonLite } from "@/lib/types";
import AssignSelect from "./AssignSelect";
import DeleteButton from "./DeleteButton";

/** 숙소 배정 — 방 목록 + 방 추가 + 미배정 인원 배정 */
export default function RoomsPanel({
  rooms,
  people,
}: {
  rooms: AdminRoom[];
  people: PersonLite[];
}) {
  const byRoom = new Map<string, PersonLite[]>();
  people.forEach((person) => {
    if (person.room_id)
      byRoom.set(person.room_id, [...(byRoom.get(person.room_id) ?? []), person]);
  });
  const unassigned = people.filter((person) => !person.room_id);
  const usedCount = rooms.filter(
    (room) => (byRoom.get(room.id) ?? []).length > 0
  ).length;

  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: `${room.building} ${room.room_no} (${(byRoom.get(room.id) ?? []).length}/${room.capacity})`,
  }));

  return (
    <>
      <div className="sec-title">
        <b>숙소 배정</b>
        <span>
          {usedCount}/{rooms.length} ROOMS
        </span>
      </div>

      {rooms.map((room) => {
        const members = byRoom.get(room.id) ?? [];
        const emptyCount = Math.max(0, room.capacity - members.length);
        return (
          <div className="room" key={room.id}>
            <div className="top">
              <b>
                {room.building} {room.room_no}
              </b>
              <span
                className={`cap${members.length >= room.capacity ? " full" : ""}`}
              >
                {members.length} / {room.capacity}
                {members.length === 0 && (
                  <DeleteButton kind="room" id={room.id} />
                )}
              </span>
            </div>
            <div className="members">
              {members.map((member) => (
                <span key={member.id}>{member.name}</span>
              ))}
              {Array.from({ length: emptyCount }).map((_, i) => (
                <span className="empty" key={`empty-${i}`}>
                  ＋ 빈 자리
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <form className="inline-form" action={createRoom}>
        <input name="building" placeholder="건물 (비전관)" required />
        <input
          name="room_no"
          placeholder="호수 (203)"
          required
          style={{ maxWidth: 90 }}
        />
        <input
          name="capacity"
          placeholder="정원"
          type="number"
          min={1}
          defaultValue={4}
          style={{ maxWidth: 70 }}
        />
        <button className="btn sm ghost">방 추가</button>
      </form>

      <div className="unassigned">
        <div className="eyebrow">숙소 미배정 · {unassigned.length}명</div>
        {unassigned.length === 0 && (
          <p style={{ fontSize: ".8rem", color: "var(--ink-60)", marginTop: 8 }}>
            전원 배정 완료.
          </p>
        )}
        {unassigned.map((person) => (
          <div className="assign-row" key={person.id}>
            <b>{person.name}</b>
            <AssignSelect
              kind="room"
              participantId={person.id}
              options={roomOptions}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <a
          className="btn ghost"
          style={{ flex: 1, textAlign: "center" }}
          href="/api/admin/export"
        >
          명단 다운로드
        </a>
      </div>
    </>
  );
}
