"use client";

import Link from "next/link";
import { openLogin } from "@/lib/ui";
import { useSession } from "@/components/SessionProvider";

export default function NavAuth() {
  const { session, loaded } = useSession();

  return (
    <div className="nav-auth">
      {session.isAdmin && (
        <Link className="lnk" href="/admin" style={{ color: "var(--coral)" }}>
          Admin
        </Link>
      )}
      {/* 로드 전에는 폭만 잡아둬 상태가 바뀔 때 메뉴가 밀리지 않게 */}
      <span className="auth-slot">
        {!loaded ? null : session.authed ? (
          <form action="/auth/signout" method="post" style={{ display: "flex" }}>
            <button className="lnk" type="submit">
              로그아웃
            </button>
          </form>
        ) : (
          <button className="lnk" type="button" onClick={() => openLogin()}>
            로그인
          </button>
        )}
      </span>
    </div>
  );
}
