import { requireAdmin } from "@/lib/admin";
import CheckinPanel from "./CheckinPanel";

export const dynamic = "force-dynamic";

export default async function AdminCheckinPage() {
  // 데모 여부는 레이아웃의 AdminModeProvider가 내려주므로 여기서는 가드만 건다
  await requireAdmin();
  return <CheckinPanel />;
}
