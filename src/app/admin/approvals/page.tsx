import { requireAdmin } from "@/lib/admin";
import RosterTabs from "../RosterTabs";
import ApprovalsList from "./ApprovalsList";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const ctx = await requireAdmin();

  return (
    <>
      <RosterTabs />
      <div className="sec-title">
        <b>가입 승인</b>
      </div>
      <p className="hint-text">
        신청 명단에 있는 사람만 요청을 보낼 수 있어요. 소셜 프로필이 아는 분이
        맞는지 확인하고 승인해주세요. 모르는 프로필이면 본인에게 확인한 뒤
        처리하세요.
      </p>

      {/* 목록은 폴링으로 — 대시보드·참가자 명단과 같은 주기 */}
      <ApprovalsList demo={ctx.demo} />
    </>
  );
}
