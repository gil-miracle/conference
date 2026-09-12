"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { todayTimetableHref } from "@/lib/gallery-days";
import { TABS } from "./routes";
import { TabIcon } from "./TabIcons";
import { useSession } from "@/components/SessionProvider";

/** 모바일 하단 탭바 — 자주 쓰는 다섯 개 (TABS) */
export default function BottomTabs() {
  const pathname = usePathname();
  const { session } = useSession();
  /* 일정표는 오늘 날짜 주소로. 서버 그림은 첫 날(하이드레이션이 맞아야 한다)이고
     마운트 뒤에 오늘로 바꾼다 — 링크 주소만 바뀌니 화면이 흔들리지 않는다 */
  const [timetableHref, setTimetableHref] = useState<string | null>(null);
  useEffect(() => setTimetableHref(todayTimetableHref()), []);
  const toOf = (m: { href: string; to?: string }) =>
    m.href === "/timetable" ? (timetableHref ?? m.to ?? m.href) : (m.to ?? m.href);

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
            href={toOf(m)}
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
