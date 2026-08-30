import type { MySummary } from "@/lib/types";

/**
 * 내 숙소.
 *
 * 공개 전에도 카드는 둔다. 없다가 생기면 "내 건 왜 없지"가 되고, 있으면
 * "아직 안 나왔구나"로 읽힌다 — 같은 상태를 두 가지로 보여줄 이유가 없다.
 */
export default function RoomCard({
  room,
  mates,
  open,
}: {
  room: MySummary["room"];
  mates: string[];
  /** 관리자가 숙소·조를 공개했는가 */
  open: boolean;
}) {
  return (
    <div className="my-card room-card">
      <div className="eyebrow">MY ROOM</div>
      {!open ? (
        <>
          <h3 className="tbd">미정</h3>
          <small>배정이 끝나면 여기에 열려요.</small>
        </>
      ) : room ? (
        <>
          <h3>
            {room.building} {room.room_no}호
          </h3>
          <small>{room.note ?? `${room.capacity}인실`}</small>
          {mates.length > 0 && (
            <div className="mates">
              {mates.map((mate) => (
                <span key={mate}>{mate}</span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h3>배정 전</h3>
          <small>숙소가 배정되면 여기에 보여요.</small>
        </>
      )}
    </div>
  );
}
