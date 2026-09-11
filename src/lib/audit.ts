import "server-only";
import type { AdminCtx } from "./admin";

/** 남기는 일의 종류 — 화면에서 한국어로 풀어 쓴다 */
export type AuditAction =
  | "approve"
  | "approve_all"
  | "reject"
  | "unbind"
  | "checkin"
  | "checkin_undo"
  | "participant_delete"
  | "photo_hide"
  | "photo_day"
  | "photo_delete"
  | "note_hide"
  | "note_delete"
  | "setting"
  | "mentor_members"
  | "mentor_session_edit"
  | "mentor_session_delete"
  | "song_set_delete"
  | "room_members"
  | "room_delete"
  | "team_members"
  | "team_delete"
  | "sheet_sync"
  | "host"
  | "role"
  | "wordcard_reset";

type Ctx = Extract<AdminCtx, { demo: false }> | { supabase: unknown; me: { id: string; name: string } };

/**
 * 감사 기록 한 줄.
 *
 * 실패해도 던지지 않는다. 기록은 곁일이라, 이것 때문에 승인이나 체크인이
 * 막히면 본말이 뒤집힌다 — 데스크에서 줄이 서 있는데 로그 때문에 못 넘어가는
 * 일은 없어야 한다.
 *
 * 이름을 그때 값 그대로 박는다. 나중에 그 사람이 명단에서 빠져도 「누가
 * 했는지」는 남아야 하기 때문이다.
 */
export async function logAdmin(
  ctx: Ctx,
  action: AuditAction,
  target: string | null,
  detail?: Record<string, unknown>
) {
  const db = (ctx as { supabase: { from: (t: string) => { insert: (v: unknown) => Promise<unknown> } } })
    .supabase;
  try {
    await db.from("admin_audit").insert({
      actor_id: ctx.me.id,
      actor_name: ctx.me.name,
      action,
      target,
      detail: detail ?? null,
    });
  } catch {
    // 기록이 안 남는 것보다 본 일이 막히는 것이 나쁘다
  }
}
