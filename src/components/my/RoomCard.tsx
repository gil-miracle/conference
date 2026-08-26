import type { MySummary } from "@/lib/types";

export default function RoomCard({
  room,
  mates,
}: {
  room: MySummary["room"];
  mates: string[];
}) {
  return (
    <div className="my-card room-card">
      <div className="eyebrow">MY ROOM</div>
      {room ? (
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
