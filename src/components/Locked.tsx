import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import { LockIcon } from "@/components/icons";

/**
 * 잠긴 화면.
 *
 * 로그인이나 명단 연결이 필요한 자리에서, 빈 목록 대신 왜 비었는지와 다음에
 * 뭘 하면 되는지를 같이 보여준다 — 빈 화면만 두면 고장 난 줄 안다.
 */
export default function Locked({
  children,
  icon,
  showLogin = false,
  showBind = false,
}: {
  children: React.ReactNode;
  /** 그 화면을 나타내는 아이콘 — 없으면 자물쇠 */
  icon?: React.ReactNode;
  showLogin?: boolean;
  showBind?: boolean;
}) {
  return (
    <div className="locked reveal">
      {icon ?? <LockIcon />}
      <p>{children}</p>
      {showLogin && <LoginButton>로그인</LoginButton>}
      {showBind && (
        <Link className="btn accent" href="/connect">
          신청 명단과 연결하기
        </Link>
      )}
    </div>
  );
}
