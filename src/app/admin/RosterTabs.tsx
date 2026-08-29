"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB = [
  { href: "/admin/checkin", label: "명단" },
  { href: "/admin/approvals", label: "가입 승인" },
  { href: "/admin/rooms", label: "숙소" },
  { href: "/admin/teams", label: "팀" },
];

/**
 * 명단 안쪽 갈래.
 *
 * 명단·가입 승인·숙소·팀은 결국 같은 참석자를 다르게 자른 것이라, 위쪽 탭을 네
 * 칸 쓰는 대신 한 묶음으로 넣는다. 숙소를 보다 "이 사람 누구지" 하면 한 칸 옆이다.
 */
export default function RosterTabs() {
  const pathname = usePathname();
  return (
    <nav className="subtabs">
      <div className="subtabs-in">
        {SUB.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={pathname.startsWith(t.href) ? "on" : ""}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
