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
          잘못 적은 곳이 있으면 고쳐서 다시 보낼 수 있어요.
        </p>
        <small className="pending-note">
          맞게 적었는데도 반려됐다면 운영진에 문의해주세요.
        </small>
        {/* 반려로 끝나면 안 된다 — 대개는 이름·전화를 잘못 적은 것이라
            고칠 자리를 여기서 열어 준다 */}
        <Link className="btn accent" href="/connect">
          다시 요청하기
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
