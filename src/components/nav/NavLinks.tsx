"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ROUTES } from "./routes";
import { LockIcon } from "@/components/icons";

export default function NavLinks({ authed }: { authed: boolean }) {
  const pathname = usePathname();
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-links">
      {NAV_ROUTES.map((r) => (
        <Link key={r.href} className={`lnk${isOn(r.href) ? " on" : ""}`} href={r.href}>
          {r.label}
        </Link>
      ))}
      <Link className={`lnk${authed ? "" : " lock"}${isOn("/my") ? " on" : ""}`} href="/my">
        {!authed && <LockIcon />}My
      </Link>
      <Link
        className={`lnk${authed ? "" : " lock"}${isOn("/gallery") ? " on" : ""}`}
        href="/gallery"
      >
        {!authed && <LockIcon />}갤러리
      </Link>
    </div>
  );
}
