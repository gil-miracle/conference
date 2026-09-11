import { fmtDateTime } from "@/lib/format";

export type AuditRow = {
  id: number;
  at: string;
  actor_name: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
};

/** 무엇을 한 일인지 — 코드가 아니라 사람 말로 */
const WHAT: Record<string, string> = {
  approve: "가입 승인",
  approve_all: "일괄 승인",
  reject: "가입 반려",
  unbind: "연결 해제",
  checkin: "체크인",
  checkin_undo: "체크인 취소",
  participant_delete: "참가자 삭제",
  photo_hide: "사진 숨김",
  photo_delete: "사진 삭제",
  note_hide: "노트 숨김",
  note_delete: "노트 삭제",
  setting: "설정 변경",
  mentor_members: "멘토 신청자 변경",
  mentor_session_edit: "멘토 세션 수정",
  mentor_session_delete: "멘토 세션 삭제",
  song_set_delete: "집회 삭제",
  room_members: "숙소 배정",
  room_delete: "방 삭제",
  team_members: "조 배정",
  team_delete: "조 삭제",
  sheet_sync: "명단 동기화",
  host: "진행자 지정",
  role: "관리자 지정",
  wordcard_reset: "말씀카드 초기화",
};

/** 되돌릴 수 없는 일은 눈에 먼저 들어와야 한다 */
const HEAVY = new Set([
  "reject",
  "room_delete",
  "team_delete",
  "role",
  "unbind",
  "participant_delete",
  "photo_delete",
  "note_delete",
  "mentor_session_delete",
  "song_set_delete",
]);

/** 곁에 적을 한 마디 — 자세한 것은 다 적지 않는다. 읽을 수 없으면 없는 것과 같다 */
function note(row: AuditRow): string | null {
  const d = row.detail ?? {};
  if (row.action === "setting")
    return typeof (d.value as { value?: unknown })?.value === "boolean"
      ? ((d.value as { value?: boolean }).value ? "켬" : "끔")
      : null;
  if (row.action === "note_hide" || row.action === "photo_hide")
    return d.hidden ? "숨김" : "다시 보임";
  if (row.action === "mentor_members")
    return [d.added ? `+${d.added}` : null, d.removed ? `-${d.removed}` : null]
      .filter(Boolean)
      .join(" ") || null;
  if (row.action === "reject" && typeof d.reason === "string") return d.reason;
  if (row.action === "role") return d.role === "admin" ? "지정" : "해제";
  if (row.action === "host") return d.on ? "지정" : "해제";
  if (row.action === "approve_all") return `${d.count}명`;
  if (row.action === "room_members" || row.action === "team_members")
    return [d.added ? `+${d.added}` : null, d.removed ? `-${d.removed}` : null]
      .filter(Boolean)
      .join(" ") || null;
  if (row.action === "sheet_sync")
    return [d.added ? `추가 ${d.added}` : null, d.updated ? `갱신 ${d.updated}` : null]
      .filter(Boolean)
      .join(" · ") || null;
  return null;
}

/**
 * 운영 기록.
 *
 * 운영진이 여럿이라 「이 사람 승인 누가 했지」, 「이 사진 누가 지웠지」가
 * 행사 중에 반드시 나온다. 지금까지는 결과만 남고 손댄 사람은 안 남아서
 * 물어보는 수밖에 없었고, 그마저 기억에 기댔다.
 */
export default function AuditCard({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="set">
      <div className="row">
        <div>
          <b>운영 기록</b>
          <small>누가 무엇을 했는지 최근 50건. 지울 수 없어요.</small>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="hint-sm mt-10">아직 남은 기록이 없어요.</p>
      ) : (
        <ol className="audit">
          {rows.map((r) => {
            const n = note(r);
            return (
              <li key={r.id} className={HEAVY.has(r.action) ? "heavy" : undefined}>
                <time>{fmtDateTime(r.at)}</time>
                <span className="who">{r.actor_name}</span>
                <span className="what">
                  {WHAT[r.action] ?? r.action}
                  {r.target && <b>{r.target}</b>}
                  {n && <em>{n}</em>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
