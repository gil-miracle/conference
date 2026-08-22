"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

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
