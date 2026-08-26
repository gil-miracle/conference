import type { MenuKey } from "@/lib/types";

export type MenuItem = {
  href: string;
  /** 상단 메뉴에 쓰는 이름 */
  label: string;
  /** 하단 탭바에 쓰는 짧은 이름 (좁아서 긴 이름이 안 들어간다) */
  short: string;
  icon: TabIcon;
  /** 관리자 설정의 노출 토글과 연결. null이면 항상 보인다 */
  key: MenuKey | null;
  /** 로그인해야 내용이 보이는 메뉴 — 비로그인 시 자물쇠를 단다 */
  locked?: boolean;
};

export type TabIcon = "home" | "clock" | "user" | "music" | "pen" | "camera" | "qr";

/**
 * 사이트 메뉴 — **상단 내비와 하단 탭바가 같은 목록을 쓴다.**
 * 화면 폭에 따라 메뉴가 달라지면 "모바일엔 있는데 데스크톱엔 없네"가 생긴다.
 *
 * 홈은 넣지 않는다 — 상단의 MIRACLE 로고가 모바일에서도 보이고 그게 홈이다.
 */
export const MENU: readonly MenuItem[] = [
  { href: "/timetable", label: "일정표", short: "일정표", icon: "clock", key: "timetable" },
  { href: "/songs", label: "찬양리스트", short: "찬양", icon: "music", key: "songs" },
  { href: "/guestbook", label: "방명록", short: "방명록", icon: "pen", key: "guestbook" },
  { href: "/gallery", label: "갤러리", short: "갤러리", icon: "camera", key: "gallery", locked: true },
  { href: "/my", label: "My", short: "My", icon: "qr", key: null, locked: true },
];

/**
 * 하단 탭바 — 상단 메뉴에서 자주 쓰는 것만 다섯 개로 추린다.
 * 여섯 개를 넘기면 좁은 화면에서 글자가 뭉개지고, 엄지로 짚기도 어렵다.
 * 상단은 로고가 홈 역할을 하지만 여기는 없으므로 홈을 넣는다.
 */
export const TABS: readonly MenuItem[] = [
  { href: "/", label: "홈", short: "홈", icon: "home", key: null },
  { href: "/timetable", label: "일정표", short: "일정", icon: "clock", key: "timetable" },
  { href: "/songs", label: "찬양", short: "찬양", icon: "music", key: "songs" },
  { href: "/gallery", label: "갤러리", short: "갤러리", icon: "camera", key: "gallery" },
  { href: "/my", label: "내정보", short: "내정보", icon: "qr", key: null },
];
