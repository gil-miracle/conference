"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDemo } from "../AdminMode";
import { setTeamMembers } from "../actions/teams";
import type { AdminTeam, PersonLite } from "@/lib/types";

/**
 * 사람 한 명을 조에 넣는다 — 조가 아니라 사람 쪽에서 시작하는 길.
 * 숙소의 RoomPicker와 같다. 조에는 정원도 성별도 없어 막히는 조가 없다.
 */
export default function TeamPicker({
  person,
  teams,
  countOf,
  onClose,
}: {
  person: PersonLite | null;
  teams: AdminTeam[];
  countOf: (teamId: string) => number;
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

  const assign = async (teamId: string) => {
    if (!person) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await setTeamMembers(teamId, [person.id], []);
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
            {teams.length === 0 && <p className="hint-sm">아직 만든 조가 없어요.</p>}
            {teams.map((team) => (
              <button
                type="button"
                key={team.id}
                className="pick-row"
                disabled={busy}
                onClick={() => assign(team.id)}
              >
                <span>{team.name}</span>
                <em>{countOf(team.id)}명</em>
              </button>
            ))}
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
