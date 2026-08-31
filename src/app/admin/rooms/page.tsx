import { requireAdmin } from "@/lib/admin";
import { DEMO_HOLDS, DEMO_PEOPLE, DEMO_ROOMS } from "@/lib/demo";
import type { AdminRoom, PersonLite, RoomHold } from "@/lib/types";
import RosterTabs from "../RosterTabs";
import RoomsPanel from "./RoomsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const ctx = await requireAdmin();

  let rooms: AdminRoom[] = DEMO_ROOMS;
  let people: PersonLite[] = DEMO_PEOPLE;
  let holds: RoomHold[] = DEMO_HOLDS;

  if (!ctx.demo) {
    const [roomsRes, peopleRes, holdsRes] = await Promise.all([
      ctx.supabase
        .from("rooms")
        .select("id,building,room_no,capacity,gender,note,leader_id")
        .order("building")
        .order("room_no"),
      ctx.supabase
        .from("participants")
        .select("id,name,room_id,team_id,no_stay,cell_group,inviter,applicant_type,gender")
        .order("name"),
      ctx.supabase
        .from("room_holds")
        .select("id,room_id,name,gender")
        .order("created_at"),
    ]);
    rooms = (roomsRes.data ?? []) as AdminRoom[];
    people = (peopleRes.data ?? []) as PersonLite[];
    holds = (holdsRes.data ?? []) as RoomHold[];
  }

  return (
    <>
      <RosterTabs />
      <RoomsPanel rooms={rooms} people={people} holds={holds} />
    </>
  );
}
