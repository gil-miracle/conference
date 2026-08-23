"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function createRoom(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const building = String(formData.get("building") ?? "").trim();
  const room_no = String(formData.get("room_no") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 4) || 4;
  if (!building || !room_no) return;
  await ctx.supabase.from("rooms").insert({ building, room_no, capacity });
  revalidatePath("/admin/rooms");
}

export async function deleteRoom(roomId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("rooms").delete().eq("id", roomId);
  revalidatePath("/admin/rooms");
}

export async function assignRoom(participantId: string, roomId: string | null) {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase
    .from("participants")
    .update({ room_id: roomId })
    .eq("id", participantId);
  revalidatePath("/admin/rooms");
}
