"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";
import { useAdminDemo } from "../AdminMode";
import { createRoom, deleteRoom, updateRoom } from "../actions/rooms";
import { ROOM_GENDERS, type AdminRoom } from "@/lib/types";

/**
 * 방 만들기·고치기·지우기.
 *
 * 한 줄짜리 추가 폼은 만들 때만 쓸 수 있어서, 정원을 잘못 넣거나 성별을 잘못
 * 고르면 지우고 다시 만드는 수밖에 없었다. 같은 폼을 모달로 올려 방 제목을
 * 누르면 그대로 고치게 한다.
 *
 * 지우기도 여기 둔다 — 방을 지우면 그 방 사람들이 미배정으로 돌아가므로,
 * 몇 명이 걸려 있는지 보이는 자리에서 누르는 편이 낫다.
 */
export default function RoomEditor({
  room,
  memberCount = 0,
}: {
  /** 없으면 새 방을 만드는 모드 */
  room?: AdminRoom;
  memberCount?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) setMsg(null);
  }, [open]);

  const submit = async (formData: FormData) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = room
      ? await updateRoom(room.id, formData)
      : await createRoom(formData);
    setBusy(false);
    if (!res?.ok) return setMsg(res?.message ?? "저장하지 못했어요.");
    setOpen(false);
    router.refresh();
  };

  const drop = async () => {
    if (!room) return;
    const ok = await confirm({
      message:
        memberCount > 0
          ? `${room.building} ${room.room_no}을 지울까요? 배정된 ${memberCount}명은 미배정으로 돌아가요.`
          : `${room.building} ${room.room_no}을 지울까요?`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await deleteRoom(room.id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      {room ? (
        <button type="button" className="room-open" onClick={() => setOpen(true)}>
          <b>
            {room.building} {room.room_no}
            <span className="rg" data-g={room.gender}>
              {room.gender}
            </span>
          </b>
          <span className={`cap${memberCount >= room.capacity ? " full" : ""}`}>
            {memberCount} / {room.capacity}
          </span>
        </button>
      ) : (
        <button className="btn sm ghost room-add" onClick={() => setOpen(true)}>
          ＋ 방 추가
        </button>
      )}

      <dialog
        ref={ref}
        className="pdetail"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
      >
        {open && (
          <div className="pdetail-in">
            <header>
              <b>{room ? "방 정보" : "방 추가"}</b>
            </header>

            <form className="pform" action={submit}>
              <label>
                <span>건물</span>
                <input
                  name="building"
                  defaultValue={room?.building ?? ""}
                  placeholder="비전관"
                  required
                />
              </label>
              <label>
                <span>호수</span>
                <input
                  name="room_no"
                  defaultValue={room?.room_no ?? ""}
                  placeholder="203"
                  required
                />
              </label>
              <label>
                <span>정원</span>
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  defaultValue={room?.capacity ?? 4}
                  required
                />
              </label>
              <label>
                <span>성별</span>
                <select name="gender" defaultValue={room?.gender ?? "남"} required>
                  {ROOM_GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <div className="pform-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn accent" disabled={busy}>
                  {busy ? "저장 중…" : room ? "저장" : "추가"}
                </button>
              </div>
            </form>

            {room && (
              <button
                type="button"
                className="btn sm danger full mt-12"
                disabled={busy}
                onClick={drop}
              >
                방 삭제
              </button>
            )}

            {msg && <p className="msg mt-12">{msg}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
