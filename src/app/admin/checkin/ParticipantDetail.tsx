"use client";

import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/Confirm";
import { fmtBirth, fmtDateTime, groupTag } from "@/lib/format";
import { useAdminDemo } from "../AdminMode";
import { assignRoom } from "../actions/rooms";
import { assignTeam } from "../actions/teams";
import { setRole } from "../actions/role";
import type { AdminParticipant, AdminRoom, AdminTeam } from "@/lib/types";

/**
 * 참가자 상세.
 *
 * 목록 한 줄에는 두 줄까지만 실어서 신청서에 적힌 나머지가 안 보인다.
 * 데스크에서 "이 사람 숙박 며칠이지" 같은 질문이 나올 때 이름만 누르면 되게 한다.
 *
 * 고칠 수 있는 건 **앱이 주인인 값만**이다 — 숙소·조·관리자 권한.
 * 신청 정보의 원본은 구글 시트라, 여기서 고쳐 봐야 다음 동기화 때 되돌아간다.
 * 고칠 수 있게 보이는 편이 오히려 사고를 부른다.
 */
export default function ParticipantDetail({
  participant,
  rooms,
  teams,
  onClose,
  onChanged,
}: {
  participant: AdminParticipant | null;
  rooms: AdminRoom[];
  teams: AdminTeam[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const confirm = useConfirm();
  const demo = useAdminDemo();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (participant && !el.open) el.showModal();
    if (!participant && el.open) el.close();
    setMsg(null);
  }, [participant]);

  const p = participant;
  const tag = p && groupTag(p);

  const run = async (fn: () => Promise<unknown>) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
  };

  const toggleAdmin = async () => {
    if (!p) return;
    const next = p.role === "admin" ? "member" : "admin";
    const ok = await confirm({
      message:
        next === "admin"
          ? `${p.name} 님에게 관리자 권한을 줄까요? 명단·체크인·설정을 모두 볼 수 있게 됩니다.`
          : `${p.name} 님의 관리자 권한을 내릴까요?`,
      confirmLabel: next === "admin" ? "관리자로" : "권한 내리기",
      danger: next === "member",
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await setRole(p.id, next);
    setBusy(false);
    setMsg(res.message);
    if (res.ok) onChanged();
  };

  /** 값이 없는 줄은 아예 그리지 않는다 — 빈 칸이 늘어서면 훑기 어렵다 */
  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ) : null;

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
      {p && (
        <div className="pdetail-in">
          <header>
            <b>
              {p.name}
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
            </b>
            <button className="btn sm ghost" onClick={onClose}>
              닫기
            </button>
          </header>

          <dl>
            <Row label="생년월일" value={fmtBirth(p.birth_date)} />
            {/* 데스크에서 전화를 걸어야 해서 가리지 않는다 */}
            <Row label="전화번호" value={p.phone} />
            <Row label="유형" value={p.applicant_type} />
            <Row label="초청자" value={p.inviter} />
            <Row label="오는 방법" value={p.transport} />
            <Row
              label="도착"
              value={[p.arrive_day, p.arrive_time].filter(Boolean).join(" ") || null}
            />
            <Row label="숙박일" value={p.stay} />
            <Row label="티셔츠" value={p.tshirt} />
            <Row
              label="로그인"
              value={
                p.bound_provider
                  ? `${p.bound_provider}${p.bound_at ? ` · ${fmtDateTime(p.bound_at)}` : ""}`
                  : "연결 전"
              }
            />
            <Row
              label="체크인"
              value={p.checked_in_at ? fmtDateTime(p.checked_in_at) : "아직"}
            />
          </dl>

          {/* 여기부터는 앱이 주인이라 동기화가 건드리지 않는다 */}
          <div className="pdetail-edit">
            <label>
              <span>숙소</span>
              <select
                value={p.room_id ?? ""}
                disabled={busy}
                onChange={(e) => run(() => assignRoom(p.id, e.target.value || null))}
              >
                <option value="">미배정</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.building} {r.room_no}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>조</span>
              <select
                value={p.team_id ?? ""}
                disabled={busy}
                onChange={(e) => run(() => assignTeam(p.id, e.target.value || null))}
              >
                <option value="">미배정</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn sm ghost full" disabled={busy} onClick={toggleAdmin}>
              {p.role === "admin" ? "관리자에서 내리기" : "관리자로 지정"}
            </button>
          </div>

          {msg && <p className="msg mt-12">{msg}</p>}

          <small className="pdetail-note">
            신청 정보(유형·다락방·도착·티셔츠 등)는 구글 시트가 원본이에요. 고치려면
            시트를 고치고 설정 탭에서 다시 동기화해주세요. 숙소·조·권한은 여기서 바꾼
            값이 유지됩니다.
          </small>
        </div>
      )}
    </dialog>
  );
}
