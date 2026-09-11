"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

/** 뽑은 카드 한 장 — 그림 주소(slug)와 거기 적힌 말씀 */
export type DrawnCard = {
  id: string;
  slug: string;
  ref_en: string;
  body: string;
  bold: string;
};

/**
 * 내 말씀카드를 뽑는다.
 *
 * 고르는 것이 아니라 받는 것이다. 한 번 뽑으면 그 장이 내 것으로 남고,
 * 다시 눌러도 같은 장이 나온다 — 마음에 드는 구절이 나올 때까지 다시
 * 뽑을 수 있으면 「내게 주신 말씀」이 아니라 고른 말씀이 된다.
 *
 * 누가 어느 장을 받는지는 DB가 정한다(0043). 아직 아무도 안 뽑은 장을
 * 먼저 주므로 100명까지는 겹치지 않는다.
 */
export async function drawMyWordcard(): Promise<DrawnCard | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase.rpc("draw_my_wordcard");
  if (!data) return null;

  // 내 정보 화면은 뽑았는지 여부를 서버에서 읽어 그린다
  revalidatePath("/profile");
  return data as DrawnCard;
}
