"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/checkin", label: "체크인" },
  { href: "/admin/rooms", label: "숙소·조" },
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
            (t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href))
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
