"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";
import { useAdminDemo } from "../AdminMode";
import {
  createMentorSession,
  deleteMentorSession,
  updateMentorSession,
} from "../actions/mentoring";
import { fmtDateTime } from "@/lib/format";
import { isStaff } from "@/lib/participant-fields";
import type { AdminParticipant } from "@/lib/types";
import type { AdminMentorSession } from "@/lib/mentoring";
import type { SignupRow } from "./page";

type Person = Pick<AdminParticipant, "id" | "name" | "applicant_type">;

/** ISO 문자열을 datetime-local 입력이 읽는 지역 시각으로 */
function forInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SessionEditor({
  session,
  people,
}: {
  session?: AdminMentorSession;
  people: Person[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) setMsg(null);
  }, [open]);

  const submit = async (formData: FormData) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = session
      ? await updateMentorSession(session.id, formData)
      : await createMentorSession(formData);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  const drop = async () => {
    if (!session) return;
    const ok = await confirm({
      message:
        session.taken > 0
          ? `${session.mentor_name} 세션을 지울까요? 신청한 ${session.taken}명의 신청도 함께 사라져요.`
          : `${session.mentor_name} 세션을 지울까요?`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await deleteMentorSession(session.id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      {session ? (
        <button type="button" className="room-open" onClick={() => setOpen(true)}>
          <b>{session.mentor_name}</b>
          <span className={`cap${session.taken >= session.capacity ? " full" : ""}`}>
            {session.taken} / {session.capacity}
          </span>
        </button>
      ) : (
        <button className="btn sm ghost room-add" onClick={() => setOpen(true)}>
          ＋ 세션 추가
        </button>
      )}

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
              <b>{session ? "세션 정보" : "세션 추가"}</b>
            </header>

            <form className="pform" action={submit}>
              <label>
                <span>멘토</span>
                <input
                  name="mentor_name"
                  defaultValue={session?.mentor_name ?? ""}
                  placeholder="김멘토 목사"
                  maxLength={30}
                  required
                />
              </label>
              <label>
                {/* 명단에 있는 분이면 이어둔다 — 없어도 세션은 만들 수 있다 */}
                <span>명단</span>
                <select name="mentor_id" defaultValue={session?.mentor_id ?? ""}>
                  <option value="">연결 안 함</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>주제</span>
                <input
                  name="title"
                  defaultValue={session?.title ?? ""}
                  placeholder="청년의 때에 드리는 기도"
                  maxLength={60}
                  required
                />
              </label>
              <label>
                {/* 고르기 전에 읽을 몇 줄. 없으면 카드에서 그 줄이 통째로 빠진다 */}
                <span>강의 소개</span>
                <textarea
                  name="intro"
                  defaultValue={session?.intro ?? ""}
                  placeholder="어떤 이야기를 나누는 시간인지 두세 문장으로"
                  maxLength={300}
                  rows={3}
                />
              </label>
              <label>
                {/* public 아래 올린 파일이면 `/mentors/이름.jpg` 처럼 경로만 */}
                <span>사진</span>
                <input
                  name="photo_url"
                  defaultValue={session?.photo_url ?? ""}
                  placeholder="/mentors/문경숙.jpg"
                  maxLength={500}
                />
              </label>
              <label>
                <span>장소</span>
                <input
                  name="place"
                  defaultValue={session?.place ?? ""}
                  placeholder="본관 세미나실"
                  maxLength={40}
                />
              </label>
              <label>
                <span>정원</span>
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  defaultValue={session?.capacity ?? 35}
                  required
                />
              </label>
              <label>
                <span>세션 시각</span>
                <input
                  name="starts_at"
                  type="datetime-local"
                  defaultValue={forInput(session?.starts_at)}
                  required
                />
              </label>
              <label>
                <span>신청 시작</span>
                <input
                  name="opens_at"
                  type="datetime-local"
                  defaultValue={forInput(session?.opens_at)}
                  required
                />
              </label>
              <label>
                {/* 이 시각이 지나면 신청도 취소도 변경도 막힌다 — 세션이 끝나는 시각을 넣는다 */}
                <span>신청 마감</span>
                <input
                  name="closes_at"
                  type="datetime-local"
                  defaultValue={forInput(session?.closes_at)}
                  required
                />
              </label>
              <label>
                <span>순서</span>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={session?.sort_order ?? 0}
                />
              </label>

              <div className="pform-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn accent" disabled={busy}>
                  {busy ? "저장 중…" : session ? "저장" : "추가"}
                </button>
              </div>
            </form>

            {session && (
              <button
                type="button"
                className="btn sm danger full mt-12"
                disabled={busy}
                onClick={drop}
              >
                세션 삭제
              </button>
            )}

            {msg && <p className="msg mt-12">{msg}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}

export default function MentoringPanel({
  sessions,
  people,
  signups,
}: {
  sessions: AdminMentorSession[];
  people: Person[];
  signups: SignupRow[];
}) {
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "이름 없음";
  const membersOf = (sessionId: string) =>
    signups
      .filter((s) => s.session_id === sessionId)
      .map((s) => nameOf(s.participant_id))
      .sort();

  const chosen = new Set(signups.map((s) => s.participant_id));
  /* 교역자·멘토는 신청 대상이 아니다 — 여기 남아 있으면 "아직 안 고른 사람"이
     영영 0이 되지 않아 무엇이 남았는지 알 수 없다 */
  const notYet = people.filter(
    (p) => !chosen.has(p.id) && !isStaff(p.applicant_type)
  );

  return (
    <>
      <div className="sec-title">
        <b>멘토의 TMI</b>
      </div>

      <SessionEditor people={people} />

      {sessions.length === 0 ? (
        <p className="hint-sm">
          아직 세션이 없어요. 여기서 만들면 참가자 화면에 나타납니다.
        </p>
      ) : (
        sessions.map((session) => {
          const members = membersOf(session.id);
          return (
            <div className="room" key={session.id}>
              <SessionEditor session={session} people={people} />
              <small className="room-note">
                {session.title}
                {session.place && ` · ${session.place}`} · {fmtDateTime(session.starts_at)}
              </small>
              <div className="members">
                {members.length === 0 ? (
                  <span className="mchip-empty">아직 신청자가 없어요</span>
                ) : (
                  /* 숙소·팀 화면과 같은 칩 — 이름이 줄글로 이어지면 몇 명인지
                     세어지지도, 누가 있는지 훑어지지도 않는다 */
                  members.map((name) => (
                    <span className="mchip" key={name}>
                      {name}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}

      {sessions.length > 0 && (
        <div className="unassigned">
          <div className="eyebrow">아직 안 고른 사람 · {notYet.length}명</div>
          {notYet.length === 0 ? (
            <p className="hint-sm">전원 신청 완료.</p>
          ) : (
            <div className="members mt-10">
              {notYet.map((p) => (
                <span className="mchip" key={p.id}>
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
