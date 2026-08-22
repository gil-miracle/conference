"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function createTeam(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const name = String(formData.get("name") ?? "").trim();
  const leader = String(formData.get("leader") ?? "").trim() || null;
  if (!name) return;
  await ctx.supabase.from("teams").insert({ name, leader });
  revalidatePath("/admin/rooms");
}

export async function deleteTeam(teamId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("teams").delete().eq("id", teamId);
  revalidatePath("/admin/rooms");
}

export async function assignTeam(participantId: string, teamId: string | null) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase
    .from("participants")
    .update({ team_id: teamId })
    .eq("id", participantId);
  revalidatePath("/admin/rooms");
}

/** 미배정 인원을 인원수 적은 조부터 채워 배정 — 조별 1회 일괄 업데이트 */
export async function autoAssignTeams() {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const [{ data: teams }, { data: unassigned }, { data: assigned }] =
    await Promise.all([
      ctx.supabase.from("teams").select("id"),
      ctx.supabase.from("participants").select("id").is("team_id", null),
      ctx.supabase
        .from("participants")
        .select("team_id")
        .not("team_id", "is", null),
    ]);
  if (!teams || teams.length === 0 || !unassigned || unassigned.length === 0)
    return;

  const load = new Map<string, number>(teams.map((t) => [t.id, 0]));
  (assigned ?? []).forEach((row) => {
    if (row.team_id) load.set(row.team_id, (load.get(row.team_id) ?? 0) + 1);
  });

  // 라운드로빈으로 조별 배정 목록을 만든 뒤, 조당 한 번씩만 update
  const buckets = new Map<string, string[]>(teams.map((t) => [t.id, []]));
  for (const person of unassigned) {
    const [teamId] = [...load.entries()].sort((a, b) => a[1] - b[1])[0];
    buckets.get(teamId)!.push(person.id);
    load.set(teamId, (load.get(teamId) ?? 0) + 1);
  }
  for (const [teamId, ids] of buckets) {
    if (ids.length === 0) continue;
    await ctx.supabase
      .from("participants")
      .update({ team_id: teamId })
      .in("id", ids);
  }
  revalidatePath("/admin/rooms");
}
