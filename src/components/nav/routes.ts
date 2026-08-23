/** 사이트 내비게이션 라우트 — 상단 메뉴와 하단 탭바가 공유 */
export const NAV_ROUTES = [
  { href: "/about", label: "About", short: "소개" },
  { href: "/speakers", label: "Speakers", short: "강사" },
  { href: "/timetable", label: "Timetable", short: "일정" },
  { href: "/songs", label: "Songs", short: "찬양" },
  { href: "/guestbook", label: "방명록", short: "방명록" },
] as const;

/** 하단 탭바 — 모바일에서 자주 쓰는 5개 (행사 당일 동선 기준) */
export const TAB_ROUTES = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/timetable", label: "일정", icon: "clock" },
  { href: "/speakers", label: "강사", icon: "user" },
  { href: "/songs", label: "찬양", icon: "music" },
  { href: "/my", label: "My", icon: "qr" },
] as const;

export type TabIcon = (typeof TAB_ROUTES)[number]["icon"];
