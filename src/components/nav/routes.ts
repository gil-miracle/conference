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

export type TabIcon = "clock" | "user" | "music" | "pen" | "camera" | "qr";

/**
 * 사이트 메뉴 — **상단 내비와 하단 탭바가 같은 목록을 쓴다.**
 * 화면 폭에 따라 메뉴가 달라지면 "모바일엔 있는데 데스크톱엔 없네"가 생긴다.
 *
 * 홈은 넣지 않는다 — 상단의 MIRACLE 로고가 모바일에서도 보이고 그게 홈이다.
 */
export const MENU: readonly MenuItem[] = [
  { href: "/timetable", label: "일정표", short: "일정표", icon: "clock", key: "timetable" },
  { href: "/speakers", label: "설교자", short: "설교자", icon: "user", key: "speakers" },
  { href: "/songs", label: "찬양리스트", short: "찬양", icon: "music", key: "songs" },
  { href: "/guestbook", label: "방명록", short: "방명록", icon: "pen", key: "guestbook" },
  { href: "/gallery", label: "갤러리", short: "갤러리", icon: "camera", key: "gallery", locked: true },
  { href: "/my", label: "My", short: "My", icon: "qr", key: null, locked: true },
];
