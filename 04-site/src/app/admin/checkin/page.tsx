import { requireAdmin } from "@/lib/admin";
import CheckinPanel from "./CheckinPanel";

export const dynamic = "force-dynamic";

export default async function AdminCheckinPage() {
  const ctx = await requireAdmin();
  return <CheckinPanel demo={ctx.demo} />;
}
