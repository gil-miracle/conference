"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDemo } from "../AdminMode";
import { setTeamLeader, setTeamMembers } from "../actions/teams";
import type { PersonLite } from "@/lib/types";

/**
 * 조 하나의 사람들 — 이름 칩과 「인원 추가」, 그리고 둘 다 여는 배정 모달.
 *
 * 숙소와 같은 방식이다. 다른 점은 조에는 정원도 성별도 없다는 것뿐이라,
 * 빈 자리 칸도 없고 후보를 성별로 거르지도 않는다.
 *
 * 체크는 "이 조에 있을 사람"이다. 풀면 미배정으로 돌아간다.
 */
export default function TeamFill({
  teamId,
  teamName,
  people,
  members,
  leaderId,
}: {
  teamId: string;
  teamName: string;
  /** 아직 어느 조에도 없는 사람 */
  people: PersonLite[];
  /** 지금 이 조에 있는 사람 */
  members: PersonLite[];
  leaderId: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [leader, setLeader] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const memberIds = members.map((m) => m.id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) {
      setPicked(memberIds);
      setLeader(leaderId);
      setQ("");
      setMsg(null);
    }
    // memberIds는 매 렌더 새 배열이라 의존성에 넣으면 열자마자 되돌려진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leaderId]);

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // 조 밖으로 뺀 사람이 조장으로 남아 있으면 안 된다
  const pickedLeader = leader && picked.includes(leader) ? leader : null;
  const add = picked.filter((id) => !memberIds.includes(id));
  const remove = memberIds.filter((id) => !picked.includes(id));
  const dirty = add.length > 0 || remove.length > 0 || pickedLeader !== leaderId;

  const save = async () => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await setTeamMembers(teamId, add, remove);
    const led =
      pickedLeader !== leaderId ? await setTeamLeader(teamId, pickedLeader) : null;
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    if (led && !led.ok) return setMsg(led.message);
    setOpen(false);
    router.refresh();
  };

  const rows = [...members, ...people].filter((p) => !q || p.name.includes(q));
  // 조장이 맨 앞
  const sorted = [...members].sort((a, b) =>
    a.id === leaderId ? -1 : b.id === leaderId ? 1 : 0
  );

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
          {m.id === leaderId && <i>조장</i>}
        </button>
      ))}
      <button type="button" className="empty" onClick={() => setOpen(true)}>
        ＋ 인원 추가
      </button>

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
              <b>{teamName}</b>
              <span className="cap">{picked.length}명</span>
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
                        onChange={() => toggle(p.id)}
                      />
                      <span>{p.name}</span>
                      {p.gender && (
                        <i className="fg" data-g={p.gender}>
                          {p.gender}
                        </i>
                      )}
                    </label>
                    <button
                      type="button"
                      className={`lead-pick${leader === p.id ? " on" : ""}`}
                      disabled={!on}
                      onClick={() => setLeader(leader === p.id ? null : p.id)}
                    >
                      조장
                    </button>
                  </div>
                );
              })}
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
