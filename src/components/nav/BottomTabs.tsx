"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TAB_ROUTES } from "./routes";
import { TabIcon } from "./TabIcons";
import LinkPending from "./LinkPending";

/** 모바일 하단 탭바 — 행사 당일 동선(일정·강사·찬양·QR) 기준 5개 */
export default function BottomTabs({ authed }: { authed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TAB_ROUTES.map((tab) => {
        const on =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <TabIcon name={tab.icon} />
            <span>{tab.label}</span>
            <LinkPending />
            {tab.href === "/my" && !authed && <i className="dot" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
