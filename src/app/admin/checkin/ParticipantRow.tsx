"use client";

import { ProviderMark } from "@/components/icons";
import { fmtBirth, fmtTime, groupTag, maskPhone } from "@/lib/format";
import type { AdminParticipant } from "@/lib/types";

/** 폼 선택지가 길어 잘리므로 괄호 안 설명은 떼어낸다 — "공동체 버스(9/11 …)" → "공동체 버스" */
const short = (s: string | null) => (s ?? "").split("(")[0].trim();

export default function ParticipantRow({
  participant,
  onToggleCheckin,
  onOpen,
}: {
  participant: AdminParticipant;
  onToggleCheckin: () => void;
  onOpen: () => void;
}) {
  const p = participant;
  // 다락방이 있으면 다락방, 초청 받은 지체면 그렇게 — 한 자리에 하나만 띄운다
  const tag = groupTag(p);
  // 도착 정보는 있는 것만 이어 붙인다 — 빈 값 사이에 점만 남으면 지저분하다
  const arrive = [p.arrive_day, p.arrive_time, short(p.transport)]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-row">
      <div className="info">
        {/* 이름을 누르면 상세 — 목록에 다 못 싣는 신청 정보를 여기서 본다 */}
        <button className="pname" onClick={onOpen}>
          {p.name}
          {/* 로고는 이름 바로 옆 — 배지 뒤로 밀면 사람마다 위치가 달라져 못 찾는다 */}
          {p.bound_provider && <ProviderMark provider={p.bound_provider} />}
          {tag && (
            <span className="tagit" data-g={tag}>
              {tag}
            </span>
          )}
          {p.role === "admin" && (
            <span className="tagit" data-g="관리자">
              관리자
            </span>
          )}
          {p.is_host && (
            <span className="tagit" data-g="진행자">
              진행자
            </span>
          )}
        </button>
        {/* 없는 값은 가운데점까지 같이 빠진다 — 교역자·멘토는 생년월일이 없다 */}
        <small>
          {[
            fmtBirth(p.birth_date),
            p.gender,
            maskPhone(p.phone),
            p.rooms ? `${p.rooms.building} ${p.rooms.room_no}` : "미배정",
          ]
            .filter(Boolean)
            .join(" · ")}
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
    </div>
  );
}
