"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import type { JoinRequest, ParticipantStatus } from "@/lib/types";

export async function getJoinRequests(
  status: ParticipantStatus = "pending"
): Promise<JoinRequest[]> {
  const ctx = await getAdminContext();
  if (!ctx) return [];
  const { data } = await ctx.supabase.rpc("admin_join_requests", {
    p_status: status,
  });
  return (data as JoinRequest[]) ?? [];
}

export async function setParticipantStatus(
  participantId: string,
  status: ParticipantStatus,
  reason?: string
) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const { data, error } = await ctx.supabase.rpc("admin_set_status", {
    p_participant_id: participantId,
    p_status: status,
    p_reason: reason ?? null,
  });
  if (error) return { ok: false as const, message: "처리에 실패했어요." };

  const result = data as { status?: string; name?: string };
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return result.status === "ok"
    ? { ok: true as const, name: result.name ?? "" }
    : { ok: false as const, message: "처리에 실패했어요." };
}

/** 명단 일괄 등록 후 대기 건을 한 번에 승인 */
export async function approveAllPending() {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, count: 0 };
  const { data, error } = await ctx.supabase.rpc("admin_approve_all");
  if (error) return { ok: false as const, count: 0 };
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return { ok: true as const, count: (data as { approved?: number })?.approved ?? 0 };
}
