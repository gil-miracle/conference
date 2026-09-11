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
  /* 게임은 이번에 안 쓴다 — 탭에서 뺀다. 주소로는 그대로 들어간다 */
  { href: "/admin/board", label: "게시판" },
  { href: "/admin/settings", label: "설정" },
];

export default function AdminTabs({
  galleryOnly = false,
}: {
  /** 사진 담당 — 게시판 하나만 보인다. 다른 탭은 들어가도 게시판으로 돌아온다 */
  galleryOnly?: boolean;
}) {
  const pathname = usePathname();
  const tabs = galleryOnly ? TABS.filter((t) => t.href === "/admin/board") : TABS;
  return (
    <nav className="tabs">
      {tabs.map((t) => (
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
