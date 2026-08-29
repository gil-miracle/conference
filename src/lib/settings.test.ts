import { describe, expect, it } from "vitest";
import { DEFAULT_MENUS, parseSiteSettings } from "./settings";

/**
 * 설정은 key-value + jsonb라 스키마가 강제되지 않는다.
 * 값이 없거나 깨졌을 때 "안전한 쪽"으로 떨어지는지가 핵심.
 */
describe("parseSiteSettings", () => {
  it("설정이 아예 없으면 안전한 기본값", () => {
    const s = parseSiteSettings(null);
    expect(s.banner.visible).toBe(false);
    expect(s.galleryOpen).toBe(false); // 갤러리는 기본 잠금
    expect(s.roomsOpen).toBe(false); // 숙소도 기본 비공개
    expect(s.guestbookOpen).toBe(true); // 방명록만 기본 허용
    expect(s.menus).toEqual(DEFAULT_MENUS);
  });

  it("빈 배너 텍스트는 visible이 켜져 있어도 숨긴다", () => {
    const s = parseSiteSettings([
      { key: "banner", value: { text: "", visible: true } },
    ]);
    expect(s.banner.visible).toBe(false); // 빈 배너가 레이아웃만 밀어내면 안 된다
  });

  it("텍스트 + visible이 둘 다 있어야 표시된다", () => {
    const s = parseSiteSettings([
      { key: "banner", value: { text: "우천 시 대예배실", visible: true } },
    ]);
    expect(s.banner).toEqual({ text: "우천 시 대예배실", visible: true });
  });

  it("갤러리·숙소는 명시적 true일 때만 열린다", () => {
    expect(parseSiteSettings([{ key: "gallery_open", value: {} }]).galleryOpen).toBe(false);
    expect(
      parseSiteSettings([{ key: "gallery_open", value: { value: true } }]).galleryOpen
    ).toBe(true);
    expect(
      parseSiteSettings([{ key: "rooms_open", value: { value: false } }]).roomsOpen
    ).toBe(false);
  });

  it("방명록은 명시적 false일 때만 닫힌다", () => {
    expect(parseSiteSettings([]).guestbookOpen).toBe(true);
    expect(
      parseSiteSettings([{ key: "guestbook_open", value: { value: false } }]).guestbookOpen
    ).toBe(false);
  });

  it("메뉴 설정이 일부만 있으면 나머지는 기본값(노출)으로 채운다", () => {
    const s = parseSiteSettings([
      { key: "menu_visibility", value: { gallery: false, songs: false } },
    ]);
    expect(s.menus.gallery).toBe(false);
    expect(s.menus.songs).toBe(false);
    expect(s.menus.timetable).toBe(true); // 새로 생긴 메뉴가 조용히 사라지면 안 된다
    expect(s.menus.guestbook).toBe(true);
  });

  it("없어진 메뉴가 DB에 남아 있어도 딸려 들어오지 않는다", () => {
    const s = parseSiteSettings([
      { key: "menu_visibility", value: { speakers: false, songs: false } },
    ]);
    expect(s.menus).toEqual({ ...DEFAULT_MENUS, songs: false });
  });

  it("모르는 key는 무시한다", () => {
    const s = parseSiteSettings([{ key: "미래에_생길_설정", value: { value: true } }]);
    expect(s.menus).toEqual(DEFAULT_MENUS);
  });
});
