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
import { INVITED, fmtDateTime, groupTag } from "@/lib/format";
import { isStaff } from "@/lib/participant-fields";
import type { AdminParticipant } from "@/lib/types";
import type { AdminMentorSession } from "@/lib/mentoring";
import SessionFill from "./SessionFill";
import type { SignupRow } from "./page";

type Person = Pick<
  AdminParticipant,
  "id" | "name" | "applicant_type" | "gender" | "cell_group" | "inviter" | "cancelled_at"
>;

/**
 * 멘토 강의를 신청하지 않는 다락방 — 코너스톤은 따로 모이므로 「아직 안 고른
 * 사람」에 세지 않는다 (2026-09-11 결정). 교역자·멘토와 같은 이유로 뺀다.
 */
const SKIP_GROUPS = new Set(["CORNERSTONE", "코너스톤"]);
const skipsMentoring = (p: Person) =>
  Boolean(p.cancelled_at) ||
  isStaff(p.applicant_type) ||
  SKIP_GROUPS.has((p.cell_group ?? "").trim().toUpperCase());

/** 숙소 화면과 같은 차례 — 지체 다락방 → 현장접수 → 초청자 → 기타 */
const RANK = (key: string) => (key === INVITED ? 1 : key === "기타" ? 2 : 0);
function byGroup(people: Person[]) {
  const map = new Map<string, Person[]>();
  for (const person of people) {
    const key = groupTag(person) ?? "기타";
    map.set(key, [...(map.get(key) ?? []), person]);
  }
  return [...map.entries()].sort(
    ([a], [b]) => RANK(a) - RANK(b) || a.localeCompare(b),
  );
}

/** ISO 문자열을 datetime-local 입력이 읽는 지역 시각으로 */
function forInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SessionEditor({ session }: { session?: AdminMentorSession }) {
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
              <p className="pform-sec">멘토</p>
              <label>
                {/* 명단 연결 칸은 뺐다 — 저장만 되고 아무 데서도 읽지 않는
                    값이었다. 멘토는 신청 대상이 아니라 명단과 이어 둘 일이
                    없고, 화면에 나가는 것은 아래 이름이다 */}
                <span>이름</span>
                <input
                  name="mentor_name"
                  defaultValue={session?.mentor_name ?? ""}
                  placeholder="김멘토 목사"
                  maxLength={30}
                  required
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

              <p className="pform-sec">강의</p>
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
                {/* 카드에서 이름 아래 붙는 소개. 없으면 그 줄이 통째로 빠진다 */}
                <span>멘토 소개</span>
                <textarea
                  name="intro"
                  defaultValue={session?.intro ?? ""}
                  placeholder="어떤 분인지, 어떤 이야기를 나누는지 두세 문장으로"
                  maxLength={300}
                  rows={4}
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
              <p className="pform-sec">시각</p>
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
                {/* 작은 수가 앞에 선다. 같으면 세션 시각 순 */}
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
  const byId = new Map(people.map((p) => [p.id, p]));
  const sessionOf = new Map(signups.map((s) => [s.participant_id, s.session_id]));
  const mentorOf = new Map(sessions.map((s) => [s.id, s.mentor_name]));

  const membersOf = (sessionId: string) =>
    signups
      .filter((s) => s.session_id === sessionId)
      .map((s) => byId.get(s.participant_id))
      .filter((p): p is Person => Boolean(p))
      .sort((a, b) => a.name.localeCompare(b.name));

  /* 후보 = 아직 아무 데도 안 고른 사람 + 다른 세션에 있는 사람.
     다른 세션 사람도 함께 두면 「저쪽에서 빼고 이쪽에 넣기」가 한 걸음이 된다 */
  const othersFor = (sessionId: string) =>
    people
      .filter((p) => !isStaff(p.applicant_type) && sessionOf.get(p.id) !== sessionId)
      .map((p) => ({
        id: p.id,
        name: p.name,
        gender: p.gender,
        atName: mentorOf.get(sessionOf.get(p.id) ?? "") ?? null,
      }));

  const chosen = new Set(signups.map((s) => s.participant_id));
  /* 취소자·교역자·멘토·코너스톤은 신청 대상이 아니다 — 여기 남아 있으면 "아직 안 고른
     사람"이 영영 0이 되지 않아 무엇이 남았는지 알 수 없다 */
  const notYet = people.filter((p) => !chosen.has(p.id) && !skipsMentoring(p));

  return (
    <>
      <div className="sec-title">
        <b>멘토의 TMI</b>
      </div>

      <SessionEditor />

      {sessions.length === 0 ? (
        <p className="hint-sm">
          아직 세션이 없어요. 여기서 만들면 참가자 화면에 나타납니다.
        </p>
      ) : (
        sessions.map((session) => {
          const members = membersOf(session.id);
          return (
            <div className="room" key={session.id}>
              <SessionEditor session={session} />
              <small className="room-note">
                {session.title}
                {session.place && ` · ${session.place}`} · {fmtDateTime(session.starts_at)}
              </small>
              {/* 숙소 화면과 같은 칩 — 눌러서 넣고 뺀다. 이름이 줄글로
                  이어지면 몇 명인지 세어지지도, 누가 있는지 훑어지지도 않는다 */}
              <SessionFill
                sessionId={session.id}
                mentorName={session.mentor_name}
                capacity={session.capacity}
                members={members.map((m) => ({ id: m.id, name: m.name, gender: m.gender }))}
                others={othersFor(session.id)}
              />
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
            /* 숙소 화면과 같은 틀 — 다락방으로 묶고, 성별로 색을 나눈다.
               같은 일을 하는 목록은 같은 모양이어야 화면을 옮겨도 읽힌다.
               교역자·멘토·코너스톤은 애초에 빠져 있다 */
            byGroup(notYet).map(([group, list]) => (
              <div className="un-group" key={group}>
                <small>
                  {group} · {list.length}명
                </small>
                <div className="members">
                  {list.map((p) => (
                    <span className="mchip" data-g={p.gender ?? ""} key={p.id}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
