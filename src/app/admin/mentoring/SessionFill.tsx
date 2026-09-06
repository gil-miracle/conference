"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDemo } from "../AdminMode";
import { setSessionMembers } from "../actions/mentoring";

export type FillPerson = {
  id: string;
  name: string;
  gender?: string | null;
  /** 지금 어느 세션에 있는지 — 다른 세션 사람을 데려올 때 알려 준다 */
  atName?: string | null;
};

/**
 * 세션 한 칸의 신청자 — 이름 칩과 빈 자리, 그리고 둘 다 여는 배정 모달.
 *
 * 참가자 화면에서는 본인이 고르고 바꾼다. 그런데 데스크에서는 대신 넣어
 * 주거나 빼 주어야 할 일이 생긴다 — 신청을 못 한 채 온 사람, 자리를 바꿔
 * 달라는 사람. 여기에 그 길이 아예 없어서 이름만 읽고 손을 못 댔다.
 *
 * 숙소 화면과 같은 모양으로 둔다. 체크는 「이 세션에 있을 사람」이고, 풀면
 * 신청이 취소된다 — 넣기만 되고 빼기가 안 되면 잘못 넣었을 때 손쓸 방법이
 * 없다.
 *
 * 다른 세션에 있는 사람도 목록에 둔다. 지금 어디 있는지를 이름 옆에 적어
 * 두었으니, 체크하면 이쪽으로 옮겨 온다 — 옮기려고 저쪽 세션을 먼저 열어
 * 빼고 오는 두 걸음을 없앤다.
 */
export default function SessionFill({
  sessionId,
  mentorName,
  capacity,
  members,
  others,
}: {
  sessionId: string;
  mentorName: string;
  capacity: number;
  /** 지금 이 세션을 고른 사람 */
  members: FillPerson[];
  /** 아직 아무 데도 안 고른 사람 + 다른 세션에 있는 사람 */
  others: FillPerson[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) {
      setPicked(members.map((m) => m.id));
      setQ("");
      setMsg(null);
    }
    // members는 열 때의 값만 쓴다 — 열어 둔 채 새로 고쳐지면 고르던 것이 날아간다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const all = [...members, ...others];
  const rows = q.trim()
    ? all.filter((p) => p.name.includes(q.trim()))
    : all;
  const full = picked.length >= capacity;

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    const before = members.map((m) => m.id);
    const add = picked.filter((id) => !before.includes(id));
    const remove = before.filter((id) => !picked.includes(id));
    if (add.length === 0 && remove.length === 0) return setOpen(false);
    setBusy(true);
    const res = await setSessionMembers(sessionId, add, remove);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="members">
        {members.length === 0 ? (
          <button type="button" className="mchip-empty" onClick={() => setOpen(true)}>
            아직 신청자가 없어요 — 눌러서 넣기
          </button>
        ) : (
          members.map((m) => (
            <button
              type="button"
              className="mchip"
              data-g={m.gender ?? ""}
              key={m.id}
              onClick={() => setOpen(true)}
            >
              {m.name}
            </button>
          ))
        )}
        {members.length > 0 && members.length < capacity && (
          <button type="button" className="empty" onClick={() => setOpen(true)}>
            ＋ 넣기
          </button>
        )}
      </div>

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
              <b>{mentorName}</b>
              <span className={`cap${full ? " full" : ""}`}>
                {picked.length} / {capacity}
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
                      {/* 다른 세션에 있는 사람 — 체크하면 이쪽으로 옮겨 온다 */}
                      {p.atName && <em className="fill-at">{p.atName}</em>}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="pform-actions">
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                취소
              </button>
              <button type="button" className="btn accent" disabled={busy} onClick={save}>
                {busy ? "저장 중…" : "저장"}
              </button>
            </div>

            {msg && <p className="msg mt-12">{msg}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
