import { NextResponse } from "next/server";
import { getAdminContext, isAdminPreview } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { demoAdminParticipants } from "@/lib/demo";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  // 목업 단계 — 체크인 탭 미리보기용 데모 명단
  if (isAdminPreview() || !isSupabaseConfigured()) {
    const list = demoAdminParticipants().filter(
      (p) => !q || p.name.includes(q) || p.phone.includes(q)
    );
    return NextResponse.json(list);
  }

  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let query = ctx.supabase
    .from("participants")
    .select(
      "id,name,birth_date,phone,role,is_host,source,checked_in_at,auth_user_id,bound_at,bound_provider,room_id,team_id," +
        "applicant_type,gender,cell_group,inviter,transport,arrive_day,arrive_time,stay,tshirt," +
        "rooms!participants_room_id_fkey(building,room_no,leader_id),teams!participants_team_id_fkey(name)"
    )
    .order("name")
    .limit(300);
  // PostgREST or() 필터 구문 문자를 제거해 필터 인젝션 차단
  const safe = q.replace(/[,()\\"]/g, "").slice(0, 40);
  if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
