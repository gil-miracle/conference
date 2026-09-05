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

/**
 * 소셜 계정 바인딩 해제 — 본인이 다시 로그인해 재연결.
 *
 * 승인도 함께 푼다. 승인은 사람이 아니라 **그 연결**에 붙은 것이다. 연결만
 * 끊고 승인을 남겨 두면, 다음에 그 명단에 연결하는 사람이 승인 절차 없이
 * 바로 들어온다 — 연결해제를 쓰는 상황이 대개 "엉뚱한 사람이 연결했다"인데
 * 바로 그 사람이 다시 들어올 수 있었다.
 */
export async function unbindParticipant(participantId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  const { data, error } = await ctx.supabase
    .from("participants")
    .update({
      auth_user_id: null,
      bound_at: null,
      bound_provider: null,
      status: "pending",
      approved_at: null,
    })
    .eq("id", participantId)
    .select("id");
  // 정책에 막히면 오류가 아니라 0행이 온다 — 푼 척하지 않는다
  return { ok: !error && Boolean(data?.length) };
}
