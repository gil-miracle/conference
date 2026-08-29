import { requireAdmin } from "@/lib/admin";
import { DEMO_ROOMS, DEMO_TEAMS } from "@/lib/demo";
import type { AdminRoom, AdminTeam } from "@/lib/types";
import RosterTabs from "../RosterTabs";
import CheckinPanel from "./CheckinPanel";

export const dynamic = "force-dynamic";

export default async function AdminCheckinPage() {
  // 데모 여부는 레이아웃의 AdminModeProvider가 내려주므로 여기서는 가드만 건다
  const ctx = await requireAdmin();

  // 상세 모달에서 배정을 바꾸려면 고를 목록이 있어야 한다.
  // 명단처럼 자주 바뀌지 않아 페이지를 열 때 한 번만 받는다.
  let rooms: AdminRoom[] = DEMO_ROOMS;
  let teams: AdminTeam[] = DEMO_TEAMS;
  if (!ctx.demo) {
    const [r, t] = await Promise.all([
      ctx.supabase
        .from("rooms")
        .select("id,building,room_no,capacity,gender,leader_id")
        .order("building")
        .order("room_no"),
      ctx.supabase.from("teams").select("id,name,leader").order("name"),
    ]);
    rooms = (r.data as AdminRoom[]) ?? [];
    teams = (t.data as AdminTeam[]) ?? [];
  }

  return (
    <>
      <RosterTabs />
      <CheckinPanel rooms={rooms} teams={teams} />
    </>
  );
}
