import Link from "next/link";
import { LockIcon } from "@/components/icons";

/** 로그인은 했지만 신청 명단과 아직 연결 전인 상태 */
export default function MyBindPrompt() {
  return (
    <div className="locked reveal">
      <LockIcon strokeWidth={1.6} />
      <p>
        로그인은 됐지만 아직 신청 명단과 연결 전이에요.
        <br />
        이름과 생년월일로 한 번만 연결하면 숙소·조·QR이 보여요.
      </p>
      <Link className="btn accent" href="/bind">
        신청 명단과 연결하기
      </Link>
    </div>
  );
}
