import Link from "next/link";
import type { MySummary } from "@/lib/types";

/** 가입 요청은 보냈지만 아직 승인 전 / 거절된 상태 */
export default function PendingCard({ summary }: { summary: MySummary }) {
  if (summary.status === "rejected") {
    return (
      <div className="locked reveal">
        <div className="eyebrow alert">REQUEST REJECTED</div>
        <p className="mt-14">
          <b>{summary.name}</b> 님의 가입 요청이 반려됐어요.
          {summary.reject_reason && (
            <>
              <br />
              사유: {summary.reject_reason}
            </>
          )}
          <br />
          착오라고 생각되시면 운영진에 문의해주세요.
        </p>
        <Link className="btn" href="/">
          행사 안내 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="locked reveal">
      <div className="eyebrow alert">WAITING FOR APPROVAL</div>
      <p className="mt-14">
        <b>{summary.name}</b> 님의 가입 요청을 접수했어요.
        <br />
        운영진이 확인하면 숙소·조·체크인 QR을 볼 수 있어요.
      </p>
      <small className="pending-note">
        승인은 보통 하루 안에 처리돼요. 급하시면 운영진에 문의해주세요.
      </small>
      <Link className="btn" href="/timetable">
        그동안 일정 보기
      </Link>
    </div>
  );
}
