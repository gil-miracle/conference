import Link from "next/link";
import NavLinks from "./NavLinks";
import NavAuth from "./NavAuth";
import InstallButton from "./InstallButton";

/** 상단 내비 — 데스크톱은 전체 메뉴, 모바일은 로고+인증만(메뉴는 하단 탭바) */
export default function Nav() {
  return (
    <nav className="site">
      <div className="nav-in">
        <Link href="/" className="nav-logo">
          MIRACLE
        </Link>
        <NavLinks />
        {/* 설치할 수 있을 때만 나타난다 — 닫힌 단추는 자리만 차지한다 */}
        <InstallButton />
        <NavAuth />
      </div>
    </nav>
  );
}
