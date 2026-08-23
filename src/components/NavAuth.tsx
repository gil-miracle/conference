"use client";

import Link from "next/link";
import { openLogin } from "@/lib/ui";

export default function NavAuth({
  authed,
  isAdmin,
}: {
  authed: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="nav-auth">
      {isAdmin && (
        <Link className="lnk" href="/admin" style={{ color: "var(--coral)" }}>
          Admin
        </Link>
      )}
      {authed ? (
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
    </div>
  );
}
