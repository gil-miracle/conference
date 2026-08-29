import { requireAdmin } from "@/lib/admin";
import { DEMO_PEOPLE, DEMO_ROOMS } from "@/lib/demo";
import type { AdminRoom, PersonLite } from "@/lib/types";
import RosterTabs from "../RosterTabs";
import RoomsPanel from "./RoomsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const ctx = await requireAdmin();

  let rooms: AdminRoom[] = DEMO_ROOMS;
  let people: PersonLite[] = DEMO_PEOPLE;

  if (!ctx.demo) {
    const [roomsRes, peopleRes] = await Promise.all([
      ctx.supabase
        .from("rooms")
        .select("id,building,room_no,capacity")
        .order("building")
        .order("room_no"),
      ctx.supabase
        .from("participants")
        .select("id,name,room_id,team_id")
        .order("name"),
    ]);
    rooms = (roomsRes.data ?? []) as AdminRoom[];
    people = (peopleRes.data ?? []) as PersonLite[];
  }

  return (
    <>
      <RosterTabs />
      <RoomsPanel rooms={rooms} people={people} />
    </>
  );
}
