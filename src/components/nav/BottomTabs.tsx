"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU } from "./routes";
import { TabIcon } from "./TabIcons";
import { useSession } from "@/components/SessionProvider";

/** 모바일 하단 탭바 — 상단 메뉴와 같은 MENU를 쓴다 */
export default function BottomTabs() {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {MENU.filter((m) => !m.key || session.menus[m.key]).map((m) => {
        const on = pathname === m.href || pathname.startsWith(`${m.href}/`);
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`tab${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <TabIcon name={m.icon} />
            <span>{m.short}</span>
            {m.href === "/my" && !session.authed && <i className="dot" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
