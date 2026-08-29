"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { isStaff } from "@/lib/participant-fields";

export type CheckinResult = {
  status: "ok" | "already" | "not_found" | "forbidden" | "error";
  name?: string;
  room?: string | null;
  checked_in_at?: string;
};

/** QR 스캔 체크인 — admin_checkin_by_token RPC */
export async function checkinByToken(token: string): Promise<CheckinResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { status: "forbidden" };
  const { data, error } = await ctx.supabase.rpc("admin_checkin_by_token", {
    p_token: token,
  });
  if (error) return { status: "error" };
  revalidatePath("/admin");
  return data as CheckinResult;
}

/** 수동 체크인 / 체크인 취소 */
export async function setCheckin(participantId: string, on: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };

  // 화면에서 버튼을 숨기지만 여기서도 막는다 — 유형이 바뀐 직후의 낡은 화면이나
  // QR로도 들어올 수 있다
  const { data: target } = await ctx.supabase
    .from("participants")
    .select("applicant_type")
    .eq("id", participantId)
    .maybeSingle();
  if (on && isStaff(target?.applicant_type ?? null)) return { ok: false };

  const { error } = await ctx.supabase
    .from("participants")
    .update({ checked_in_at: on ? new Date().toISOString() : null })
    .eq("id", participantId);
  revalidatePath("/admin");
  return { ok: !error };
}

/** 소셜 계정 바인딩 해제 — 본인이 다시 로그인해 재연결 */
export async function unbindParticipant(participantId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("participants")
    .update({ auth_user_id: null, bound_at: null, bound_provider: null })
    .eq("id", participantId);
  return { ok: !error };
}
