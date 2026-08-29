"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "./routes";
import { TabIcon } from "./TabIcons";
import { useSession } from "@/components/SessionProvider";

/** 모바일 하단 탭바 — 자주 쓰는 다섯 개 (TABS) */
export default function BottomTabs() {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.filter((m) => !m.key || session.menus[m.key]).map((m) => {
        const on =
          m.href === "/"
            ? pathname === "/"
            : pathname === m.href || pathname.startsWith(`${m.href}/`);
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`tab${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <TabIcon name={m.icon} />
            <span>{m.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
