"use client";

import { fmtBirth, fmtTime, maskPhone } from "@/lib/format";
import type { AdminParticipant } from "@/lib/types";

/** 폼 선택지가 길어 잘리므로 괄호 안 설명은 떼어낸다 — "공동체 버스(9/11 …)" → "공동체 버스" */
const short = (s: string | null) => (s ?? "").split("(")[0].trim();

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
  const invited = Boolean(p.inviter) || p.applicant_type?.includes("초청");
  // 다락방이 있으면 다락방, 초청 받은 지체면 그렇게 — 한 자리에 하나만 띄운다
  const tag = p.cell_group ?? (invited ? "초청자" : null);
  // 도착 정보는 있는 것만 이어 붙인다 — 빈 값 사이에 점만 남으면 지저분하다
  const arrive = [p.arrive_day, p.arrive_time, short(p.transport)]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-row">
      <div className="info">
        <b>
          {p.name}
          {tag && (
            <span className="tagit" data-g={tag}>
              {tag}
            </span>
          )}
        </b>
        <small>
          {fmtBirth(p.birth_date)} · {maskPhone(p.phone)} ·{" "}
          {p.rooms ? `${p.rooms.building} ${p.rooms.room_no}` : "미배정"}
          {p.bound_provider ? ` · ${p.bound_provider}` : ""}
        </small>
        {/* 데스크에서 "이 사람 언제 어떻게 오는지"를 바로 보게 한다 */}
        {(arrive || p.tshirt || p.inviter) && (
          <small>
            {[arrive, p.tshirt && `티셔츠 ${p.tshirt}`, p.inviter && `${p.inviter} 초청`]
              .filter(Boolean)
              .join(" · ")}
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
