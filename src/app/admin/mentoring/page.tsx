import { requireAdmin } from "@/lib/admin";
import type { AdminParticipant } from "@/lib/types";
import type { AdminMentorSession } from "@/lib/mentoring";
import MentoringPanel from "./MentoringPanel";

export const dynamic = "force-dynamic";

type Person = Pick<AdminParticipant, "id" | "name">;
export type SignupRow = { participant_id: string; session_id: string };

/** 멘토링 세션 만들기와 신청자 확인 — 관리자 */
export default async function AdminMentoringPage() {
  const ctx = await requireAdmin();

  let sessions: AdminMentorSession[] = [];
  let people: Person[] = [];
  let signups: SignupRow[] = [];

  if (!ctx.demo) {
    const [sessionsRes, peopleRes, signupsRes] = await Promise.all([
      ctx.supabase
        .from("mentor_sessions")
        .select(
          "id,mentor_id,mentor_name,title,intro,photo_url,place,starts_at,capacity,opens_at,closes_at,sort_order"
        )
        .order("starts_at")
        .order("sort_order"),
      ctx.supabase.from("participants").select("id,name").order("name"),
      ctx.supabase.from("mentor_signups").select("participant_id,session_id"),
    ]);
    // taken은 목록 RPC가 세는 값이라 여기서는 신청 행으로 직접 센다
    const rows = (signupsRes.data ?? []) as SignupRow[];
    sessions = ((sessionsRes.data ?? []) as Omit<AdminMentorSession, "taken">[]).map(
      (s) => ({ ...s, taken: rows.filter((r) => r.session_id === s.id).length })
    );
    people = (peopleRes.data ?? []) as Person[];
    signups = rows;
  }

  return <MentoringPanel sessions={sessions} people={people} signups={signups} />;
}
