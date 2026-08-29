"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDemo } from "../AdminMode";
import { setRoomMembers } from "../actions/rooms";
import type { AdminRoom, PersonLite } from "@/lib/types";

/**
 * 사람 한 명을 방에 넣는다 — 방이 아니라 사람 쪽에서 시작하는 길.
 *
 * 방 쪽에서 채우는 게 기본이지만, 남은 사람이 몇 안 될 때는 "이 사람 어디
 * 넣지"로 시작하는 편이 빠르다. 미배정 칩을 누르면 갈 수 있는 방만 보인다.
 *
 * 성별이 다른 방과 꽉 찬 방은 아예 빼지 않고 흐리게 둔다 — 목록에서 사라지면
 * 그 방이 없는 건지 못 넣는 건지 알 수 없다.
 */
export default function RoomPicker({
  person,
  rooms,
  countOf,
  onClose,
}: {
  person: PersonLite | null;
  rooms: AdminRoom[];
  countOf: (roomId: string) => number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const demo = useAdminDemo();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (person && !el.open) el.showModal();
    if (!person && el.open) el.close();
    if (person) setMsg(null);
  }, [person]);

  const assign = async (roomId: string) => {
    if (!person) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await setRoomMembers(roomId, [person.id], []);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    onClose();
    router.refresh();
  };

  return (
    <dialog
      ref={ref}
      className="pdetail"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {person && (
        <div className="pdetail-in">
          <header>
            <b>
              {person.name}
              {person.gender && (
                <span className="tagit" data-g={person.gender}>
                  {person.gender}
                </span>
              )}
            </b>
          </header>

          <div className="fill-list">
            {rooms.length === 0 && <p className="hint-sm">아직 만든 방이 없어요.</p>}
            {rooms.map((room) => {
              const used = countOf(room.id);
              const full = used >= room.capacity;
              // 기타 방은 남녀를 다 받는다
              const fits = room.gender === "기타" || room.gender === person.gender;
              return (
                <button
                  type="button"
                  key={room.id}
                  className="pick-row"
                  disabled={busy || full || !fits}
                  onClick={() => assign(room.id)}
                >
                  <span>
                    {room.building} {room.room_no}
                    <i className="fg" data-g={room.gender}>
                      {room.gender}
                    </i>
                  </span>
                  <em>
                    {used} / {room.capacity}
                    {full ? " · 자리 없음" : !fits ? " · 성별 다름" : ""}
                  </em>
                </button>
              );
            })}
          </div>

          {msg && <p className="msg mt-12">{msg}</p>}

          <div className="pform-actions">
            <button className="btn ghost" disabled={busy} onClick={onClose}>
              취소
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
