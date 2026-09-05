import Link from "next/link";
import { NEED_BIND } from "@/lib/messages";
import { LockIcon } from "@/components/icons";

/** 로그인은 했지만 신청 명단과 아직 연결 전인 상태 */
export default function ConnectPrompt() {
  return (
    <div className="locked reveal">
      <LockIcon strokeWidth={1.6} />
      <p>
        {NEED_BIND}
        <br />
        한 번만 연결하면 숙소·조·QR이 보여요.
      </p>
      <Link className="btn accent" href="/connect">
        신청 명단과 연결하기
      </Link>
    </div>
  );
}
