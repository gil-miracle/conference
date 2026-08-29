"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDemo } from "../AdminMode";
import {
  addRoomHold,
  removeRoomHold,
  setRoomMembers,
  setRoomLeader,
} from "../actions/rooms";
import type { PersonLite, RoomHold } from "@/lib/types";

/**
 * 방 한 칸의 사람들 — 이름 칩과 빈 자리, 그리고 둘 다 여는 배정 모달.
 *
 * 미배정이 쉰 명 넘게 쌓이면 아래 목록에서 한 명씩 셀렉트를 고르는 건
 * 현실적이지 않다. 방 쪽에서 시작해 한 방을 통째로 맞춘다.
 *
 * 이름도 빈 자리도 같은 모달을 연다 — 방을 손보는 일은 결국 하나라, 자리마다
 * 다른 걸 열면 어디를 눌러야 하는지 외워야 한다.
 *
 * 체크는 "이 방에 있을 사람"이다. 풀면 미배정으로 돌아간다 — 넣기만 되고
 * 빼기가 안 되면 잘못 넣었을 때 손쓸 방법이 없다.
 *
 * 후보는 방 성별에 맞는 사람만 보인다. 성별을 모르는 사람은 어느 방에나
 * 보인다 — 걸러내면 시트에 성별이 비어 있는 사람은 영영 배정할 수 없다.
 *
 * 명단에 없는 사람은 「자리 채움」으로 넣는다. 이름만 받아 한 칸을 차지할 뿐
 * 계정도 체크인도 없다 — 자리 하나 채우자고 생년월일·전화번호를 지어내면
 * 그 값이 나중에 시트 동기화에서 중복으로 되돌아온다.
 */
export default function RoomFill({
  roomId,
  roomName,
  roomGender,
  capacity,
  people,
  members,
  holds,
  leaderId,
}: {
  roomId: string;
  /** 건물 + 호수 */
  roomName: string;
  roomGender: string;
  capacity: number;
  /** 아직 어느 방에도 없는 사람 */
  people: PersonLite[];
  /** 지금 이 방에 있는 사람 */
  members: PersonLite[];
  /** 명단에 없이 한 칸만 차지하는 자리 */
  holds: RoomHold[];
  leaderId: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [leader, setLeader] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [holdName, setHoldName] = useState("");
  /* 자리 채움도 방 성별을 따른다 — 남자 방에 여자 자리를 만들 일이 없다 */
  const holdGenders = roomGender === "기타" ? ["남", "여"] : [roomGender];
  const [holdGender, setHoldGender] = useState(holdGenders[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const memberIds = members.map((m) => m.id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    // 열 때마다 지금 상태에서 시작한다 — 지난번에 고르다 만 것이 남으면 안 된다
    if (open) {
      setPicked(memberIds);
      setLeader(leaderId);
      setQ("");
      setHoldName("");
      setHoldGender(holdGenders[0]);
      setMsg(null);
    }
    // memberIds는 매 렌더 새 배열이라 의존성에 넣으면 열자마자 되돌려진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leaderId]);

  // 자리 채움도 한 칸을 차지한다
  const full = picked.length + holds.length >= capacity;

  const toggle = (id: string) =>
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return prev.length + holds.length >= capacity ? prev : [...prev, id];
    });

  // 방 밖으로 뺀 사람이 방장으로 남아 있으면 안 된다
  const pickedLeader = leader && picked.includes(leader) ? leader : null;
  const add = picked.filter((id) => !memberIds.includes(id));
  const remove = memberIds.filter((id) => !picked.includes(id));
  const dirty = add.length > 0 || remove.length > 0 || pickedLeader !== leaderId;

  const save = async () => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await setRoomMembers(roomId, add, remove);
    // 방장은 인원을 맞춘 뒤에 — 아직 그 방 사람이 아닌 상태로 걸면 어색하다
    const led =
      pickedLeader !== leaderId ? await setRoomLeader(roomId, pickedLeader) : null;
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    if (led && !led.ok) return setMsg(led.message);
    setOpen(false);
    router.refresh();
  };

  /* 지금 이 방 사람이 위, 미배정이 아래.
     기타 방은 가리지 않고, 남/여 방은 그 성별과 성별 미상만 후보로 둔다 */
  const fits = (p: PersonLite) =>
    roomGender === "기타" || !p.gender || p.gender === roomGender;
  const rows = [...members, ...people.filter(fits)].filter(
    (p) => !q || p.name.includes(q)
  );
  // 방장이 맨 앞 — 연락할 사람을 목록 위에서 바로 찾게 한다
  const sorted = [...members].sort((a, b) =>
    a.id === leaderId ? -1 : b.id === leaderId ? 1 : 0
  );
  const emptyCount = Math.max(0, capacity - members.length - holds.length);

  const run = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    router.refresh();
  };

  const addHold = () => {
    if (!holdName.trim()) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setHoldName("");
    run(() => addRoomHold(roomId, holdName, holdGender));
  };

  return (
    <>
      {sorted.map((m) => (
        <button
          type="button"
          className={`mchip${m.id === leaderId ? " lead" : ""}`}
          data-g={m.gender ?? ""}
          key={m.id}
          onClick={() => setOpen(true)}
        >
          {m.name}
          {m.id === leaderId && <i>방장</i>}
        </button>
      ))}
      {holds.map((h) => (
        <button
          type="button"
          className="mchip hold"
          key={h.id}
          data-g={h.gender ?? ""}
          onClick={() => setOpen(true)}
        >
          {h.name}
        </button>
      ))}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <button
          type="button"
          className="empty"
          key={`empty-${i}`}
          onClick={() => setOpen(true)}
        >
          ＋ 빈 자리
        </button>
      ))}

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
              <b>
                {roomName}
                <span className="rg" data-g={roomGender}>
                  {roomGender}
                </span>
              </b>
              <span
                className={`cap${picked.length + holds.length >= capacity ? " full" : ""}`}
              >
                {picked.length + holds.length} / {capacity}
              </span>
            </header>

            <input
              className="fill-search"
              placeholder="이름 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <div className="fill-list">
              {rows.length === 0 && <p className="hint-sm">고를 사람이 없어요.</p>}
              {rows.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <div key={p.id} className={`fill-row${on ? " on" : ""}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={on}
                        /* 자리가 찼으면 새로 고르는 것만 막는다 — 이미 고른
                           사람은 언제든 풀 수 있어야 한다 */
                        disabled={!on && full}
                        onChange={() => toggle(p.id)}
                      />
                      <span>{p.name}</span>
                      {p.gender && (
                        <i className="fg" data-g={p.gender}>
                          {p.gender}
                        </i>
                      )}
                    </label>
                    {/* 방장은 이 방에 있게 될 사람 중에서만 고른다 */}
                    <button
                      type="button"
                      className={`lead-pick${leader === p.id ? " on" : ""}`}
                      disabled={!on}
                      onClick={() => setLeader(leader === p.id ? null : p.id)}
                    >
                      방장
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 명단에 없는 사람 — 이름만 받아 한 칸을 차지한다 */}
            <div className="hold-add">
              {holds.map((h) => (
                <div className="hold-row" key={h.id}>
                  <span>
                    {h.name}
                    {h.gender && (
                      <i className="fg" data-g={h.gender}>
                        {h.gender}
                      </i>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-plain"
                    disabled={busy}
                    onClick={() =>
                      demo
                        ? setMsg("미리보기 모드 — 저장되지 않아요.")
                        : run(() => removeRoomHold(h.id))
                    }
                  >
                    비우기
                  </button>
                </div>
              ))}
              <div className="hold-form">
                <input
                  placeholder="이름"
                  value={holdName}
                  maxLength={20}
                  disabled={busy || (emptyCount === 0 && holds.length === 0)}
                  onChange={(e) => setHoldName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHold();
                    }
                  }}
                />
                <select
                  value={holdGender}
                  disabled={busy || holdGenders.length === 1}
                  onChange={(e) => setHoldGender(e.target.value)}
                >
                  {holdGenders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={busy || !holdName.trim() || full}
                  onClick={addHold}
                >
                  자리 채움
                </button>
              </div>
            </div>

            {msg && <p className="msg mt-12">{msg}</p>}

            <div className="pform-actions">
              <button className="btn ghost" disabled={busy} onClick={() => setOpen(false)}>
                취소
              </button>
              <button className="btn accent" disabled={busy || !dirty} onClick={save}>
                {busy ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
