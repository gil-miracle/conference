import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * 내 체크인 여부 하나만.
 *
 * 내 정보 화면이 QR을 띄운 채로 5초마다 묻는다. 데스크에서 찍는 순간 화면이
 * 「체크인 완료」로 바뀌어야 새로고침을 안 해도 된다. get_my_summary는
 * 숙소·조까지 모으는 물음이라 이 용도엔 무겁다 — 한 칸만 읽는다.
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ checkedInAt: null });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ checkedInAt: null }, { status: 401 });

  // participants_select_own — 내 줄만 보인다
  const { data } = await supabase
    .from("participants")
    .select("checked_in_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return NextResponse.json(
    { checkedInAt: data?.checked_in_at ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
