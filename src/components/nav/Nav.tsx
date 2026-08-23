import Link from "next/link";
import NavLinks from "./NavLinks";
import NavAuth from "./NavAuth";

/** 상단 내비 — 데스크톱은 전체 메뉴, 모바일은 로고+인증만(메뉴는 하단 탭바) */
export default function Nav({
  authed,
  isAdmin,
}: {
  authed: boolean;
  isAdmin: boolean;
}) {
  return (
    <nav className="site">
      <div className="nav-in">
        <Link href="/" className="nav-logo">
          MIRACLE
        </Link>
        <NavLinks authed={authed} />
        <NavAuth authed={authed} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
