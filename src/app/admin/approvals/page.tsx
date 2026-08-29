import { requireAdmin } from "@/lib/admin";
import { getJoinRequests } from "../actions/approval";
import type { JoinRequest } from "@/lib/types";
import RosterTabs from "../RosterTabs";
import JoinRequestCard from "./JoinRequestCard";
import ApproveAllButton from "./ApproveAllButton";

export const dynamic = "force-dynamic";

/** 미리보기 모드에서 보여줄 예시 요청 */
const DEMO_REQUESTS: JoinRequest[] = [
  {
    id: "demo-1",
    name: "이요셉",
    birth_date: "1992-03-02",
    phone: "010-2222-1234",
    status: "pending",
    requested_at: new Date(Date.now() - 20 * 60_000).toISOString(),
    bound_provider: "kakao",
    matched: true,
    social_name: "요셉",
    social_full_name: null,
    social_avatar: null,
    social_picture: null,
    social_email: null,
  },
  {
    id: "demo-2",
    name: "최마리아",
    birth_date: "1995-12-25",
    phone: "010-7777-5678",
    status: "pending",
    requested_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    bound_provider: "google",
    matched: true,
    social_name: "Maria Choi",
    social_full_name: "Maria Choi",
    social_avatar: null,
    social_picture: null,
    social_email: "maria@example.com",
  },
];

export default async function AdminApprovalsPage() {
  const ctx = await requireAdmin();
  const pending = ctx.demo ? DEMO_REQUESTS : await getJoinRequests("pending");

  return (
    <>
      <RosterTabs />
      <div className="sec-title">
        <b>가입 승인</b>
        <span>{pending.length} PENDING</span>
      </div>
      <p className="hint-text">
        신청 명단에 있는 사람만 요청을 보낼 수 있어요. 소셜 프로필이 아는 분이 맞는지
        확인하고 승인해주세요. 모르는 프로필이면 본인에게 확인한 뒤 처리하세요.
      </p>

      {pending.length === 0 ? (
        <p className="msg">대기 중인 가입 요청이 없어요.</p>
      ) : (
        <>
          {pending.map((req) => (
            <JoinRequestCard key={req.id} request={req} />
          ))}
          {!ctx.demo && pending.length > 1 && (
            <ApproveAllButton count={pending.length} />
          )}
        </>
      )}
    </>
  );
}
