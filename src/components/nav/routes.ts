import type { MenuKey } from "@/lib/types";

/** 사이트 내비게이션 라우트 — 상단 메뉴와 하단 탭바가 공유.
 *  key는 관리자 설정의 메뉴 노출 토글과 연결된다. */
export const NAV_ROUTES = [
  { href: "/speakers", label: "Speakers", short: "강사", key: "speakers" },
  { href: "/timetable", label: "Timetable", short: "일정", key: "timetable" },
  { href: "/songs", label: "Songs", short: "찬양", key: "songs" },
  { href: "/guestbook", label: "방명록", short: "방명록", key: "guestbook" },
] as const satisfies readonly { href: string; label: string; short: string; key: MenuKey }[];

/** 하단 탭바 — 모바일에서 자주 쓰는 5개 (행사 당일 동선 기준) */
export const TAB_ROUTES = [
  { href: "/", label: "홈", icon: "home", key: null },
  { href: "/timetable", label: "일정", icon: "clock", key: "timetable" },
  { href: "/speakers", label: "강사", icon: "user", key: "speakers" },
  { href: "/songs", label: "찬양", icon: "music", key: "songs" },
  { href: "/my", label: "My", icon: "qr", key: null },
] as const;

export type TabIcon = (typeof TAB_ROUTES)[number]["icon"];
