"use client";

import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/Confirm";
import { ProviderMark } from "@/components/icons";
import { fmtBirth, fmtDateTime, groupTag } from "@/lib/format";
import { SIGNUP_FIELDS, isStaff } from "@/lib/participant-fields";
import { useAdminDemo } from "../AdminMode";
import { assignRoom } from "../actions/rooms";
import { assignTeam } from "../actions/teams";
import { setRole } from "../actions/role";
import {
  removeParticipant,
  updateParticipant,
  type ParticipantInput,
} from "../actions/participant";
import ParticipantForm from "./ParticipantForm";
import type { AdminParticipant, AdminRoom, AdminTeam } from "@/lib/types";

const toInput = (p: AdminParticipant): ParticipantInput => ({
  name: p.name,
  birth_date: p.birth_date,
  phone: p.phone,
  applicant_type: p.applicant_type,
  cell_group: p.cell_group,
  inviter: p.inviter,
  transport: p.transport,
  arrive_day: p.arrive_day,
  arrive_time: p.arrive_time,
  stay: p.stay,
  tshirt: p.tshirt,
});

/**
 * 참가자 상세.
 *
 * 목록 한 줄에는 두 줄까지만 실어서 신청서에 적힌 나머지가 안 보인다.
 * 데스크에서 "이 사람 숙박 며칠이지" 같은 질문이 나올 때 이름만 누르면 되게 한다.
 *
 * 신청 정보도 여기서 고친다. 동기화는 명단에 없는 사람만 새로 넣고 이미 있는
 * 사람은 건드리지 않으므로, 고친 값이 다음 동기화에 덮이지 않는다.
 */
export default function ParticipantDetail({
  participant,
  rooms,
  teams,
  options,
  onClose,
  onChanged,
  onUnbind,
  onDeleted,
}: {
  participant: AdminParticipant | null;
  rooms: AdminRoom[];
  teams: AdminTeam[];
  options: Record<string, string[]>;
  onClose: () => void;
  onChanged: () => void;
  onUnbind: () => void;
  onDeleted: (message: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const confirm = useConfirm();
  const demo = useAdminDemo();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (participant && !el.open) el.showModal();
    if (!participant && el.open) el.close();
  }, [participant]);

  // 다른 사람을 열면 편집 상태와 메시지를 물린다 — 남아 있으면 엉뚱한 사람을
  // 고치고 있게 된다
  const id = participant?.id ?? null;
  useEffect(() => {
    setEditing(false);
    setMsg(null);
  }, [id]);

  const p = participant;
  const tag = p && groupTag(p);

  const run = async (fn: () => Promise<unknown>) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
  };

  const save = async (value: ParticipantInput) => {
    if (!p) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await updateParticipant(p.id, value);
    setBusy(false);
    setMsg(res.message);
    if (!res.ok) return;
    setEditing(false);
    onChanged();
  };

  const drop = async () => {
    if (!p) return;
    const ok = await confirm({
      message: `${p.name} 님을 명단에서 지울까요? 배정·체크인 기록도 함께 사라져요.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await removeParticipant(p.id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    onDeleted(`${p.name} 님을 지웠어요.`);
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

          {editing ? (
            <ParticipantForm
              /* 그 사람의 지금 값으로 새로 만든다 */
              key={p.id}
              initial={toInput(p)}
              options={options}
              busy={busy}
              submitLabel="저장"
              onSubmit={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <dl>
                <Row label="생년월일" value={fmtBirth(p.birth_date)} />
                {/* 데스크에서 전화를 걸어야 해서 가리지 않는다 */}
                <Row label="전화번호" value={p.phone} />
                {SIGNUP_FIELDS.map((f) => (
                  <Row key={f.key} label={f.label} value={p[f.key]} />
                ))}
                {/* 잘못 연결된 계정을 푸는 자리도 여기다 — 목록 줄에 두면
                    누구 걸 푸는지 모르고 누르게 된다 */}
                <div>
                  <dt>로그인</dt>
                  <dd className="dd-act">
                    <span>
                      {p.bound_provider ? (
                        <>
                          <ProviderMark provider={p.bound_provider} />
                          {p.bound_at && ` ${fmtDateTime(p.bound_at)}`}
                        </>
                      ) : (
                        "연결 전"
                      )}
                    </span>
                    {p.auth_user_id && (
                      <button
                        className="btn sm ghost"
                        disabled={busy}
                        onClick={onUnbind}
                      >
                        연결해제
                      </button>
                    )}
                  </dd>
                </div>
                {/* 교역자·멘토는 체크인 대상이 아니라 "아직"이 영영 안 바뀐다 */}
                {!isStaff(p.applicant_type) && (
                  <Row
                    label="체크인"
                    value={p.checked_in_at ? fmtDateTime(p.checked_in_at) : "아직"}
                  />
                )}
              </dl>

              {/* 여기부터는 명단 쪽에서 바꾸는 값들 */}
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
                <button
                  className="btn sm ghost full"
                  disabled={busy}
                  onClick={toggleAdmin}
                >
                  {p.role === "admin" ? "관리자에서 내리기" : "관리자로 지정"}
                </button>
                <div className="pdetail-row2">
                  <button
                    className="btn sm ghost"
                    disabled={busy}
                    onClick={() => setEditing(true)}
                  >
                    신청 정보 수정
                  </button>
                  <button className="btn sm danger" disabled={busy} onClick={drop}>
                    삭제
                  </button>
                </div>
              </div>
            </>
          )}

          {msg && <p className="msg mt-12">{msg}</p>}

        </div>
      )}
    </dialog>
  );
}
