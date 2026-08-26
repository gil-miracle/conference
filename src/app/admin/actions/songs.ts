"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { extractYoutubeId } from "@/lib/youtube";

function revalidateSongs() {
  revalidatePath("/admin/songs");
  revalidatePath("/songs");
}

// ── 집회 세트 ───────────────────────────────────────────────────

export async function createSongSet(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const day_label = String(formData.get("day_label") ?? "").trim() || null;
  const time_label = String(formData.get("time_label") ?? "").trim() || null;
  const leader = String(formData.get("leader") ?? "").trim() || null;

  const { data: last } = await ctx.supabase
    .from("song_sets")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await ctx.supabase.from("song_sets").insert({
    name,
    day_label,
    time_label,
    leader,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  revalidateSongs();
}

export async function deleteSongSet(setId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("song_sets").delete().eq("id", setId);
  revalidateSongs();
}

export async function updateSongSet(
  setId: string,
  patch: {
    name?: string;
    day_label?: string | null;
    time_label?: string | null;
    leader?: string | null;
  }
) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("song_sets")
    .update(patch)
    .eq("id", setId);
  revalidateSongs();
  return { ok: !error };
}

// ── 곡 ──────────────────────────────────────────────────────────

export async function createSong(setId: string, formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const youtube_id = extractYoutubeId(String(formData.get("youtube") ?? ""));

  const { data: last } = await ctx.supabase
    .from("songs")
    .select("sort_order")
    .eq("set_id", setId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await ctx.supabase.from("songs").insert({
    set_id: setId,
    title,
    youtube_id,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  revalidateSongs();
}

export async function updateSong(
  songId: string,
  patch: { title?: string; youtube?: string }
) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false };
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.youtube !== undefined) update.youtube_id = extractYoutubeId(patch.youtube);

  const { error } = await ctx.supabase.from("songs").update(update).eq("id", songId);
  revalidateSongs();
  return { ok: !error };
}

export async function deleteSong(songId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("songs").delete().eq("id", songId);
  revalidateSongs();
}

/** 같은 집회 안에서 곡 순서를 한 칸 이동 */
export async function moveSong(songId: string, direction: "up" | "down") {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const { data: song } = await ctx.supabase
    .from("songs")
    .select("id,set_id,sort_order")
    .eq("id", songId)
    .maybeSingle();
  if (!song) return;

  const { data: neighbor } = await ctx.supabase
    .from("songs")
    .select("id,sort_order")
    .eq("set_id", song.set_id)
    [direction === "up" ? "lt" : "gt"]("sort_order", song.sort_order)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle();
  if (!neighbor) return;

  await ctx.supabase
    .from("songs")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", song.id);
  await ctx.supabase
    .from("songs")
    .update({ sort_order: song.sort_order })
    .eq("id", neighbor.id);
  revalidateSongs();
}
