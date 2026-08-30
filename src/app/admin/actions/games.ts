"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, getHostContext } from "@/lib/admin";

type Result = { ok: false; message: string } | { ok: true; message: string };

/* ── 게임은 관리자가 만든다 ────────────────────────────────────── */

export async function createGame(formData: FormData): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "게임 이름을 입력해주세요." };
  const host_id = String(formData.get("host_id") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0) || 0;

  const { error } = await ctx.supabase
    .from("games")
    .insert({ name, host_id, note, sort_order });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/games");
  revalidatePath("/host");
  return { ok: true, message: "게임을 만들었어요." };
}

export async function updateGame(gameId: string, formData: FormData): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "게임 이름을 입력해주세요." };
  const host_id = String(formData.get("host_id") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0) || 0;

  const { error } = await ctx.supabase
    .from("games")
    .update({ name, host_id, note, sort_order })
    .eq("id", gameId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/games");
  revalidatePath("/host");
  return { ok: true, message: "저장했어요." };
}

/** 게임을 지우면 그 게임의 점수도 함께 사라진다 */
export async function deleteGame(gameId: string): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };
  const { error } = await ctx.supabase.from("games").delete().eq("id", gameId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/games");
  revalidatePath("/host");
  return { ok: true, message: "게임을 지웠어요." };
}

/* ── 점수는 진행자가 넣는다 ────────────────────────────────────── */

/**
 * 한 게임의 조별 점수를 한 번에 저장한다.
 *
 * 조마다 따로 저장하면 반쯤 저장된 상태가 남는다 — 사회를 보며 넣는 자리라
 * 어디까지 들어갔는지 되짚을 여유가 없다.
 */
export async function saveGameScores(
  gameId: string,
  scores: { teamId: string; points: number }[]
): Promise<Result> {
  const ctx = await getHostContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const rows = scores.map((s) => ({
    game_id: gameId,
    team_id: s.teamId,
    // 화면에서 지운 칸은 0으로 — null이면 "안 넣음"과 "0점"을 못 가른다
    points: Number.isFinite(s.points) ? Math.trunc(s.points) : 0,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await ctx.supabase
    .from("game_scores")
    .upsert(rows, { onConflict: "game_id,team_id" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/host");
  revalidatePath("/standings");
  return { ok: true, message: "점수를 저장했어요." };
}

/** 가산점 — 사유와 함께 쌓인다 */
export async function addBonus(
  teamId: string,
  points: number,
  reason: string
): Promise<Result> {
  const ctx = await getHostContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const n = Math.trunc(Number(points));
  // 감점은 쓰지 않기로 했다. DB는 열어두고 여기서 막는다
  if (!Number.isFinite(n) || n <= 0)
    return { ok: false, message: "점수는 1점 이상으로 넣어주세요." };
  const why = reason.trim().slice(0, 60);
  if (!why) return { ok: false, message: "사유를 적어주세요." };

  const { error } = await ctx.supabase
    .from("bonus_points")
    .insert({ team_id: teamId, points: n, reason: why, given_by: ctx.me.id });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/host");
  revalidatePath("/standings");
  return { ok: true, message: "가산점을 줬어요." };
}

export async function removeBonus(bonusId: string): Promise<Result> {
  const ctx = await getHostContext();
  if (!ctx) return { ok: false, message: "권한이 없어요." };

  const { data, error } = await ctx.supabase
    .from("bonus_points")
    .delete()
    .eq("id", bonusId)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "지워지지 않았어요." };

  revalidatePath("/host");
  revalidatePath("/standings");
  return { ok: true, message: "가산점을 지웠어요." };
}
