"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";
import { ROOM_GENDERS, type RoomGender } from "@/lib/types";

export async function createRoom(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const building = String(formData.get("building") ?? "").trim();
  const room_no = String(formData.get("room_no") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 4) || 4;
  const note = String(formData.get("note") ?? "").trim() || null;
  // 아는 값만 넣는다 — 모르는 값이 오면 DB 제약에 걸려 추가가 통째로 실패한다
  const raw = String(formData.get("gender") ?? "");
  const gender = (ROOM_GENDERS as readonly string[]).includes(raw)
    ? (raw as RoomGender)
    : null;
  if (!building || !room_no || !gender)
    return { ok: false as const, message: "값을 확인해주세요." };

  const { error } = await ctx.supabase
    .from("rooms")
    .insert({ building, room_no, capacity, gender, note });
  // (건물, 호수)가 유니크라 같은 방을 두 번 만들 수 없다
  if (error)
    return {
      ok: false as const,
      message: error.code === "23505" ? "이미 있는 방이에요." : error.message,
    };

  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "방을 만들었어요." };
}

/**
 * 방 인원을 통째로 맞춘다.
 *
 * 미배정이 쉰 명 넘게 쌓이면 한 명씩 셀렉트를 고르는 건 현실적이지 않다.
 * 넣을 사람과 뺄 사람을 한 번에 받아 방 하나를 정리한다.
 *
 * 빼는 쪽은 room_id만 비운다 — 명단에서 지우는 것이 아니라 미배정으로
 * 돌려보내는 것이다.
 */
export async function setRoomMembers(
  roomId: string,
  add: string[],
  remove: string[]
) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  if (remove.length > 0) {
    const { error } = await ctx.supabase
      .from("participants")
      .update({ room_id: null })
      .in("id", remove);
    if (error) return { ok: false as const, message: error.message };
  }
  if (add.length > 0) {
    const { error } = await ctx.supabase
      .from("participants")
      .update({ room_id: roomId })
      .in("id", add);
    if (error) return { ok: false as const, message: error.message };
  }

  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "저장했어요." };
}

/** 방장 지정·해제 — 그 방 사람 중 하나를 가리킨다 */
export async function setRoomLeader(roomId: string, participantId: string | null) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const { error } = await ctx.supabase
    .from("rooms")
    .update({ leader_id: participantId })
    .eq("id", roomId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/rooms");
  return { ok: true as const, message: participantId ? "방장을 정했어요." : "방장을 내렸어요." };
}

/** 방 정보 수정 — 건물·호수·정원·성별 */
export async function updateRoom(roomId: string, formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const building = String(formData.get("building") ?? "").trim();
  const room_no = String(formData.get("room_no") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 4) || 4;
  const note = String(formData.get("note") ?? "").trim() || null;
  const raw = String(formData.get("gender") ?? "");
  const gender = (ROOM_GENDERS as readonly string[]).includes(raw)
    ? (raw as RoomGender)
    : null;
  if (!building || !room_no || !gender)
    return { ok: false as const, message: "값을 확인해주세요." };

  const { error } = await ctx.supabase
    .from("rooms")
    .update({ building, room_no, capacity, gender, note })
    .eq("id", roomId);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "저장했어요." };
}

/**
 * 자리 채움 추가.
 *
 * 방 한 칸만 차지하는 이름이다. 명단에 올리는 것이 아니라 계정도 체크인도
 * 없다 — 자리만 채우자고 생년월일·전화번호를 지어내지 않으려고 나눠 뒀다.
 */
export async function addRoomHold(roomId: string, name: string, gender: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) return { ok: false as const, message: "이름을 입력해주세요." };
  const g = gender === "남" || gender === "여" ? gender : null;

  const { error } = await ctx.supabase
    .from("room_holds")
    .insert({ room_id: roomId, name: trimmed, gender: g });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "자리를 채웠어요." };
}

/** 자리 채움 삭제 */
export async function removeRoomHold(holdId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const { error } = await ctx.supabase.from("room_holds").delete().eq("id", holdId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "자리를 비웠어요." };
}

/** 방 삭제 — 그 방 사람들은 미배정으로 돌아간다(FK가 room_id를 비운다) */
export async function deleteRoom(roomId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };
  const { error } = await ctx.supabase.from("rooms").delete().eq("id", roomId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/rooms");
  return { ok: true as const, message: "방을 지웠어요." };
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

/**
 * 숙박 여부.
 *
 * 통학하는 사람은 방이 없는 게 정상인데, 그냥 두면 "아직 못 정한 사람"과
 * 섞여 미배정 숫자가 끝까지 안 줄어든다.
 *
 * 숙박 안 함으로 두면 방에서도 뺀다 — 둘 다일 수는 없다.
 */
export async function setNoStay(participantId: string, value: boolean) {
  const ctx = await getAdminContext();
  if (!ctx) return { ok: false as const, message: "권한이 없어요." };

  const { data, error } = await ctx.supabase
    .from("participants")
    .update(value ? { no_stay: true, room_id: null } : { no_stay: false })
    .eq("id", participantId)
    .select("id");
  if (error) return { ok: false as const, message: error.message };
  // RLS가 막으면 오류 없이 0줄이 돌아온다 — 조용히 성공한 척하지 않는다
  if (!data?.length) return { ok: false as const, message: "바꾸지 못했어요." };

  revalidatePath("/admin/rooms");
  return {
    ok: true as const,
    message: value ? "숙박 안 함으로 두었어요." : "숙박함으로 되돌렸어요.",
  };
}
