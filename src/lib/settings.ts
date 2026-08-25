import type { BannerSetting, MenuVisibility } from "./types";

export type SiteSettings = {
  banner: BannerSetting;
  galleryOpen: boolean;
  guestbookOpen: boolean;
  /** 숙소·조 배정 공개 여부 */
  roomsOpen: boolean;
  /** 항목별 메뉴 노출 */
  menus: MenuVisibility;
};

export const DEFAULT_MENUS: MenuVisibility = {
  about: true,
  speakers: true,
  timetable: true,
  songs: true,
  guestbook: true,
  gallery: true,
};

type SettingRow = { key: string; value: unknown };

/** site_settings rows → 타입 있는 설정 객체 (기본값 포함) */
export function parseSiteSettings(rows: SettingRow[] | null): SiteSettings {
  const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<
    string,
    { text?: string; visible?: boolean; value?: boolean } | undefined
  >;
  const rawMenus = (map.menu_visibility ?? {}) as Partial<MenuVisibility>;

  return {
    banner: {
      text: map.banner?.text ?? "",
      visible: map.banner?.visible === true && Boolean(map.banner?.text),
    },
    galleryOpen: map.gallery_open?.value === true,
    guestbookOpen: map.guestbook_open?.value !== false,
    roomsOpen: map.rooms_open?.value === true,
    // 설정이 없으면 전부 노출 (기본값)
    menus: { ...DEFAULT_MENUS, ...rawMenus },
  };
}
