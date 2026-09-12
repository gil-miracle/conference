"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { todayTimetableHref } from "@/lib/gallery-days";
import { MENU } from "./routes";
import { LockIcon } from "@/components/icons";
import { useSession } from "@/components/SessionProvider";

/** 상단 가로 메뉴 (데스크톱) — 하단 탭바와 같은 MENU를 쓴다 */
export default function NavLinks() {
  const pathname = usePathname();
  const { session } = useSession();
  /* 일정표는 오늘 날짜 주소로. 서버 그림은 첫 날(하이드레이션이 맞아야 한다)이고
     마운트 뒤에 오늘로 바꾼다 — 링크 주소만 바뀌니 화면이 흔들리지 않는다 */
  const [timetableHref, setTimetableHref] = useState<string | null>(null);
  useEffect(() => setTimetableHref(todayTimetableHref()), []);
  const toOf = (m: { href: string; to?: string }) =>
    m.href === "/timetable" ? (timetableHref ?? m.to ?? m.href) : (m.to ?? m.href);
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-links">
      {MENU.filter((m) => !m.key || session.menus[m.key]).map((m) => {
        const locked = m.locked && !session.authed;
        return (
          <Link
            key={m.href}
            className={`lnk${locked ? " lock" : ""}${isOn(m.href) ? " on" : ""}`}
            href={toOf(m)}
          >
            {locked && <LockIcon />}
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}
