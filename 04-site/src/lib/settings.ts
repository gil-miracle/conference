import type { BannerSetting } from "./types";

export type SiteSettings = {
  banner: BannerSetting;
  galleryOpen: boolean;
  guestbookOpen: boolean;
};

type SettingRow = { key: string; value: unknown };

/** site_settings rows → 타입 있는 설정 객체 (기본값 포함) */
export function parseSiteSettings(rows: SettingRow[] | null): SiteSettings {
  const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as
    Record<string, { text?: string; visible?: boolean; value?: boolean } | undefined>;

  return {
    banner: {
      text: map.banner?.text ?? "",
      visible: map.banner?.visible === true && Boolean(map.banner?.text),
    },
    galleryOpen: map.gallery_open?.value === true,
    guestbookOpen: map.guestbook_open?.value !== false,
  };
}
