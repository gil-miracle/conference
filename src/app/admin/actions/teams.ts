"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function createTeam(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, message: "조 이름을 입력해주세요." };

  const { error } = await ctx.supabase.from("teams").insert({ name });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/teams");
  return { ok: true as const, message: "조를 만들었어요." };
}

export async function updateTeam(teamId: string, formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, message: "조 이름을 입력해주세요." };

  const { error } = await ctx.supabase.from("teams").update({ name }).eq("id", teamId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/teams");
  return { ok: true as const, message: "저장했어요." };
}

/** 조 삭제 — 그 조 사람들은 미배정으로 돌아간다(FK가 team_id를 비운다) */
export async function deleteTeam(teamId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const { error } = await ctx.supabase.from("teams").delete().eq("id", teamId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/teams");
  return { ok: true as const, message: "조를 지웠어요." };
}

/**
 * 조 인원을 통째로 맞춘다 — 숙소와 같은 방식.
 * 빼는 쪽은 team_id만 비운다(명단에서 지우는 것이 아니다).
 */
export async function setTeamMembers(
  teamId: string,
  add: string[],
  remove: string[]
) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  if (remove.length > 0) {
    const { error } = await ctx.supabase
      .from("participants")
      .update({ team_id: null })
      .in("id", remove);
    if (error) return { ok: false as const, message: error.message };
  }
  if (add.length > 0) {
    const { error } = await ctx.supabase
      .from("participants")
      .update({ team_id: teamId })
      .in("id", add);
    if (error) return { ok: false as const, message: error.message };
  }

  revalidatePath("/admin/teams");
  return { ok: true as const, message: "저장했어요." };
}

/** 조장 지정·해제 — 그 조 사람 중 하나를 가리킨다 */
export async function setTeamLeader(teamId: string, participantId: string | null) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const { error } = await ctx.supabase
    .from("teams")
    .update({ leader_id: participantId })
    .eq("id", teamId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/teams");
  return { ok: true as const, message: participantId ? "조장을 정했어요." : "조장을 내렸어요." };
}

export async function assignTeam(participantId: string, teamId: string | null) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase
    .from("participants")
    .update({ team_id: teamId })
    .eq("id", participantId);
  revalidatePath("/admin/teams");
}
