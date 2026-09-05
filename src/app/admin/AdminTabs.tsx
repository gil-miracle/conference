"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; also?: string[] }[] = [
  { href: "/admin", label: "대시보드" },
  // 참가자는 안에서 명단·가입 승인·숙소·팀으로 갈린다 — 어디 있어도 이 탭이 켜진다
  {
    href: "/admin/checkin",
    label: "참가자",
    also: ["/admin/approvals", "/admin/rooms", "/admin/teams"],
  },
  { href: "/admin/songs", label: "찬양" },
  /* 탭은 짧게 — 일곱 칸이 한 줄을 나누므로 이름이 길면 접힌다.
     들어가면 화면 제목이 제 이름을 말해 준다 */
  { href: "/admin/mentoring", label: "멘토" },
  { href: "/admin/games", label: "게임" },
  { href: "/admin/board", label: "게시판" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={
            (t.href === "/admin"
              ? pathname === "/admin"
              : [t.href, ...(t.also ?? [])].some((h) => pathname.startsWith(h)))
              ? "on"
              : ""
          }
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
