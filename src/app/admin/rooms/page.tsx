import { requireAdmin } from "@/lib/admin";
import { DEMO_PEOPLE, DEMO_ROOMS, DEMO_TEAMS } from "@/lib/demo";
import type { AdminRoom, AdminTeam, PersonLite } from "@/lib/types";
import RoomsPanel from "./RoomsPanel";
import TeamsPanel from "./TeamsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const ctx = await requireAdmin();

  let rooms: AdminRoom[];
  let teams: AdminTeam[];
  let people: PersonLite[];

  if (ctx.demo) {
    rooms = DEMO_ROOMS;
    teams = DEMO_TEAMS;
    people = DEMO_PEOPLE;
  } else {
    const [roomsRes, teamsRes, peopleRes] = await Promise.all([
      ctx.supabase
        .from("rooms")
        .select("id,building,room_no,capacity")
        .order("building")
        .order("room_no"),
      ctx.supabase.from("teams").select("id,name,leader").order("name"),
      ctx.supabase
        .from("participants")
        .select("id,name,room_id,team_id")
        .order("name"),
    ]);
    rooms = (roomsRes.data ?? []) as AdminRoom[];
    teams = (teamsRes.data ?? []) as AdminTeam[];
    people = (peopleRes.data ?? []) as PersonLite[];
  }

  return (
    <>
      <RoomsPanel rooms={rooms} people={people} />
      <TeamsPanel teams={teams} people={people} />
    </>
  );
}
