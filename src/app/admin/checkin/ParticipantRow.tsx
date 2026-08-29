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
  // 도착 정보는 있는 것만 이어 붙인다 — 빈 값 사이에 점만 남으면 지저분하다
  const arrive = [p.arrive_day, p.arrive_time, p.transport].filter(Boolean).join(" ");
  return (
    <div className="p-row">
      <div className="info">
        <b>
          {p.name}
          {p.cell_group && <span className="tagit">{p.cell_group}</span>}
        </b>
        <small>
          {fmtBirth(p.birth_date)} · {maskPhone(p.phone)} ·{" "}
          {p.rooms ? `${p.rooms.building} ${p.rooms.room_no}` : "미배정"}
          {p.bound_provider ? ` · ${p.bound_provider}` : ""}
        </small>
        {/* 데스크에서 "이 사람 언제 어떻게 오는지"를 바로 보게 한다 */}
        {(arrive || p.tshirt) && (
          <small>
            {arrive}
            {arrive && p.tshirt ? " · " : ""}
            {p.tshirt && `티셔츠 ${p.tshirt}`}
          </small>
        )}
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
