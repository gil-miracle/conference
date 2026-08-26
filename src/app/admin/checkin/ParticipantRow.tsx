"use client";

import { fmtBirth, fmtTime, maskPhone } from "@/lib/format";
import type { AdminParticipant } from "@/lib/types";

export default function ParticipantRow({
  participant,
  onToggleCheckin,
  onUnbind,
}: {
  participant: AdminParticipant;
  onToggleCheckin: () => void;
  onUnbind: () => void;
}) {
  const p = participant;
  return (
    <div className="p-row">
      <div className="info">
        <b>{p.name}</b>
        <small>
          {fmtBirth(p.birth_date)} · {maskPhone(p.phone)} ·{" "}
          {p.rooms ? `${p.rooms.building} ${p.rooms.room_no}` : "미배정"}
          {p.bound_provider ? ` · ${p.bound_provider}` : ""}
        </small>
      </div>
      {p.checked_in_at ? (
        <button className="done" title="탭하면 체크인 취소" onClick={onToggleCheckin}>
          ✓ {fmtTime(p.checked_in_at)}
        </button>
      ) : (
        <button className="btn sm" onClick={onToggleCheckin}>
          체크인
        </button>
      )}
      {p.auth_user_id && (
        <button className="btn sm ghost" onClick={onUnbind}>
          연결해제
        </button>
      )}
    </div>
  );
}
