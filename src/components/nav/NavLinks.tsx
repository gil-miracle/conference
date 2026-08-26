"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU } from "./routes";
import { LockIcon } from "@/components/icons";
import { useSession } from "@/components/SessionProvider";

/** 상단 가로 메뉴 (데스크톱) — 하단 탭바와 같은 MENU를 쓴다 */
export default function NavLinks() {
  const pathname = usePathname();
  const { session } = useSession();
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-links">
      {MENU.filter((m) => !m.key || session.menus[m.key]).map((m) => {
        const locked = m.locked && !session.authed;
        return (
          <Link
            key={m.href}
            className={`lnk${locked ? " lock" : ""}${isOn(m.href) ? " on" : ""}`}
            href={m.href}
          >
            {locked && <LockIcon />}
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}
