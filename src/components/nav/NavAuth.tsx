"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TabIcon } from "./TabIcons";
import { openLogin } from "@/lib/ui";
import { useSession } from "@/components/SessionProvider";

/**
 * 오른쪽 계정 자리.
 *
 * 로그인 전에는 「로그인」 하나, 뒤에는 프로필 하나로 접는다. 내 정보와
 * 로그아웃을 나란히 늘어놓으면 메뉴와 계정이 한 줄에서 섞여 어디까지가
 * 사이트 메뉴인지 흐려진다.
 *
 * Admin만 밖에 둔다 — 행사 중 가장 자주 오가는 길이라 한 번 더 누르게 하면
 * 그만큼 계속 손해다.
 *
 * 세션에는 이름이 없다 — /api/session이 일부러 개인정보를 안 싣는다.
 * 그래서 이니셜 대신 사람 모양을 쓴다.
 */
export default function NavAuth() {
  const { session, loaded } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 페이지를 옮기면 닫는다 — 링크를 눌렀는데 메뉴가 남아 따라다니면 안 된다
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="nav-auth" ref={ref}>
      {session.isAdmin && (
        <Link className="lnk admin-lnk" href="/admin">
          admin
        </Link>
      )}
      {/* 로드 전에는 폭만 잡아둬 상태가 바뀔 때 메뉴가 밀리지 않게 */}
      <span className="auth-slot">
        {!loaded ? null : session.authed ? (
          <button
            type="button"
            className={`avatar${open ? " on" : ""}`}
            aria-label="내 계정"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <TabIcon name="user" />
          </button>
        ) : (
          <button className="lnk" type="button" onClick={() => openLogin()}>
            로그인
          </button>
        )}
      </span>

      {open && (
        <div className="acct-menu" role="menu">
          <Link href="/profile" role="menuitem">
            내 정보
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" role="menuitem">
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
