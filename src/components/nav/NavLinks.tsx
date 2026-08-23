"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ROUTES } from "./routes";
import { LockIcon } from "@/components/icons";
import { useSession } from "@/components/SessionProvider";

export default function NavLinks() {
  const pathname = usePathname();
  const { session } = useSession();
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-links">
      {NAV_ROUTES.map((r) => (
        <Link key={r.href} className={`lnk${isOn(r.href) ? " on" : ""}`} href={r.href}>
          {r.label}
        </Link>
      ))}
      <Link className={`lnk${session.authed ? "" : " lock"}${isOn("/my") ? " on" : ""}`} href="/my">
        {!session.authed && <LockIcon />}My
      </Link>
      <Link
        className={`lnk${session.authed ? "" : " lock"}${isOn("/gallery") ? " on" : ""}`}
        href="/gallery"
      >
        {!session.authed && <LockIcon />}갤러리
      </Link>
    </div>
  );
}
