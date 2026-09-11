import type { Photo } from "./types";

/** 행사 사흘 */
export const DAYS = ["2026-09-11", "2026-09-12", "2026-09-13"] as const;

/** 어떤 시각이 행사 며칠째인가 (0부터). 범위 밖은 가까운 끝날에 붙인다 */
export function dayOf(iso: string): number {
  // 한국 시간 기준으로 날짜만 뽑는다 — 서버·브라우저 시간대가 달라도 같게 나온다
  const date = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const i = DAYS.indexOf(date as (typeof DAYS)[number]);
  if (i >= 0) return i;
  return date < DAYS[0] ? 0 : DAYS.length - 1;
}

/**
 * 사진이 속한 날 (0부터).
 *
 * 올린 사람이 고른 날(day)이 먼저다. 사진은 그날 밤이나 이튿날 몰아서
 * 올리기 때문에 올린 시각은 믿을 것이 못 된다. 없으면(0049 전 사진)
 * 올린 시각으로 가른다.
 */
export function photoDay(p: Pick<Photo, "day" | "created_at">): number {
  return p.day ? p.day - 1 : dayOf(p.created_at);
}

/** 오늘이 행사 며칠째인가 — 현장에서 열면 오늘 칸부터 */
export const todayDay = () => dayOf(new Date().toISOString());
