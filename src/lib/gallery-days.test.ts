import { describe, expect, it } from "vitest";
import { dayOf, photoDay } from "./gallery-days";

describe("사진이 속한 날", () => {
  it("한국 시간으로 날짜를 가른다 — UTC로는 전날 밤이어도", () => {
    // 9/11 15:30Z = 9/12 00:30 KST → 둘째 날
    expect(dayOf("2026-09-11T15:30:00Z")).toBe(1);
    expect(dayOf("2026-09-12T02:30:00+09:00")).toBe(1);
    expect(dayOf("2026-09-11T20:00:00+09:00")).toBe(0);
    expect(dayOf("2026-09-13T23:59:00+09:00")).toBe(2);
  });

  it("행사 밖은 가까운 끝날에 붙인다 — 시험 사진이 사라지지 않게", () => {
    expect(dayOf("2026-09-01T12:00:00+09:00")).toBe(0);
    expect(dayOf("2026-09-20T12:00:00+09:00")).toBe(2);
  });

  it("올린 사람이 고른 날이 올린 시각보다 먼저다", () => {
    const created_at = "2026-09-12T10:00:00+09:00"; // 토요일에 올렸지만
    expect(photoDay({ day: 1, created_at })).toBe(0); // 금요일 사진
    expect(photoDay({ day: 3, created_at })).toBe(2);
  });

  it("고른 날이 없으면(0049 전 사진) 올린 시각으로", () => {
    expect(photoDay({ day: null, created_at: "2026-09-12T10:00:00+09:00" })).toBe(1);
    expect(photoDay({ created_at: "2026-09-13T10:00:00+09:00" })).toBe(2);
  });
});
