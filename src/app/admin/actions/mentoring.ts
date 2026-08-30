"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

type Result = { ok: false; message: string } | { ok: true; message: string };

/* ── 세션은 관리자가 만든다 ────────────────────────────────────── */

function readSession(formData: FormData) {
  const mentor_name = String(formData.get("mentor_name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim() || null;
  const mentor_id = String(formData.get("mentor_id") ?? "") || null;
  const capacity = Number(formData.get("capacity") ?? 20) || 20;
  const sort_order = Number(formData.get("sort_order") ?? 0) || 0;

  // datetime-local은 지역 시각 문자열로 온다. Date가 브라우저 시간대로 읽고
  // toISOString이 UTC로 바꾼다 — 서버와 참가자가 같은 순간을 본다.
  const at = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    mentor_name,
    title,
    place,
    mentor_id,
    capacity,
    sort_order,
    starts_at: at("starts_at"),
    opens_at: at("opens_at"),
    closes_at: at("closes_at"),
  };
}

function validate(v: ReturnType<typeof readSession>) {
  if (!v.mentor_name) return "멘토 성함을 입력해주세요.";
  if (!v.title) return "주제를 입력해주세요.";
  if (!v.starts_at) return "세션 시각을 확인해주세요.";
  if (!v.opens_at) return "신청 여는 시각을 확인해주세요.";
  if (!v.closes_at) return "신청 닫는 시각을 확인해주세요.";
  if (v.opens_at >= v.closes_at) return "여는 시각이 닫는 시각보다 앞서야 해요.";
  if (v.capacity < 1) return "정원은 1명 이상이어야 해요.";
  return null;
}

export async function createMentorSession(formData: FormData): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const v = readSession(formData);
  const bad = validate(v);
  if (bad) return { ok: false, message: bad };

  const { error } = await ctx.supabase.from("mentor_sessions").insert(v);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { ok: true, message: "세션을 만들었어요." };
}

export async function updateMentorSession(
  sessionId: string,
  formData: FormData
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const v = readSession(formData);
  const bad = validate(v);
  if (bad) return { ok: false, message: bad };

  const { error } = await ctx.supabase
    .from("mentor_sessions")
    .update(v)
    .eq("id", sessionId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { ok: true, message: "저장했어요." };
}

/** 세션을 지우면 그 세션 신청도 함께 사라진다 */
export async function deleteMentorSession(sessionId: string): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };
  const { error } = await ctx.supabase
    .from("mentor_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/mentoring");
  revalidatePath("/mentoring");
  return { ok: true, message: "세션을 지웠어요." };
}

/* ── 신청은 참가자가 한다 ──────────────────────────────────────── */

const SIGNUP_MESSAGES: Record<string, string> = {
  ok: "신청했어요.",
  unbound: "신청 명단과 연결한 뒤에 신청할 수 있어요.",
  not_found: "없는 세션이에요.",
  not_open: "아직 신청이 열리지 않았어요.",
  closed: "신청이 마감됐어요. 바꾸시려면 운영진에 말씀해주세요.",
  full: "자리가 찼어요. 다른 세션을 골라주세요.",
  none: "신청한 세션이 없어요.",
};

/**
 * 신청과 변경이 같은 함수 하나다.
 *
 * 「취소하고 다시 신청」으로 나누면, 옮기려던 자리가 그 사이에 차는 순간
 * 원래 자리도 잃는다. DB 쪽에서 새 세션을 먼저 잠그고 자리가 있을 때만 옮긴다.
 */
export async function setMentorSession(sessionId: string): Promise<Result> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, message: "서버 설정 전이에요." };

  const { data, error } = await supabase.rpc("set_mentor_session", {
    p_session: sessionId,
  });
  if (error) return { ok: false, message: "신청 중 오류가 났어요." };

  const status = (data as { status?: string } | null)?.status ?? "error";
  const message = SIGNUP_MESSAGES[status] ?? "신청에 실패했어요.";
  revalidatePath("/mentoring");
  return status === "ok" ? { ok: true, message } : { ok: false, message };
}

export async function leaveMentorSession(): Promise<Result> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, message: "서버 설정 전이에요." };

  const { data, error } = await supabase.rpc("leave_mentor_session");
  if (error) return { ok: false, message: "취소 중 오류가 났어요." };

  const status = (data as { status?: string } | null)?.status ?? "error";
  revalidatePath("/mentoring");
  if (status === "ok") return { ok: true, message: "신청을 취소했어요." };
  return { ok: false, message: SIGNUP_MESSAGES[status] ?? "취소에 실패했어요." };
}
