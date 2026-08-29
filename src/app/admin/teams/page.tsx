import { requireAdmin } from "@/lib/admin";
import { DEMO_PEOPLE, DEMO_TEAMS } from "@/lib/demo";
import type { AdminTeam, PersonLite } from "@/lib/types";
import RosterTabs from "../RosterTabs";
import TeamsPanel from "./TeamsPanel";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const ctx = await requireAdmin();

  let teams: AdminTeam[] = DEMO_TEAMS;
  let people: PersonLite[] = DEMO_PEOPLE;

  if (!ctx.demo) {
    const [teamsRes, peopleRes] = await Promise.all([
      ctx.supabase.from("teams").select("id,name,leader").order("name"),
      ctx.supabase
        .from("participants")
        .select("id,name,room_id,team_id,cell_group,inviter,applicant_type,gender")
        .order("name"),
    ]);
    teams = (teamsRes.data ?? []) as AdminTeam[];
    people = (peopleRes.data ?? []) as PersonLite[];
  }

  return (
    <>
      <RosterTabs />
      <TeamsPanel teams={teams} people={people} />
    </>
  );
}
