/**
 * 성경 통독 본문.
 *
 * 조영찬 전도사님 시간(MIRACLE 2)에 요한복음 1~11장을 함께 읽는다.
 *
 * 본문은 아래 RAW에 **줄마다 「절번호 한 칸 본문」** 으로 넣는다. 절 객체를
 * 손으로 쓰게 하면 430절을 옮기다 어딘가 틀리고, 틀린 것이 성경 본문이면
 * 알아채기도 어렵다. 붙여넣은 모양 그대로 받아 코드가 나눈다.
 *
 *     1 태초에 말씀이 계셨습니다…
 *     2 그분은 태초에 하나님과 함께 계셨습니다.
 *
 * 절 번호로 시작하지 않는 줄은 앞 절에 이어 붙는다 — 한 절이 여러 줄로
 * 끊겨 붙여넣어져도 절이 쪼개지지 않는다.
 */

import { JOHN_1_4 } from "./bible/john-1-4";
import { JOHN_5_7 } from "./bible/john-5-7";
import { JOHN_8_11 } from "./bible/john-8-11";

export type BibleVerse = { n: number; text: string };
export type BibleChapter = { n: number; verses: BibleVerse[] };

/** 통독 범위 — 요한복음 1~11장 */
export const READING_BOOK = "요한복음";
export const READING_TRANSLATION = "우리말성경";
export const READING_CHAPTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/**
 * 장별 본문. 한 파일에 열한 장을 다 넣으면 열 때마다 화면이 통째로 흔들려
 * 고칠 데를 찾기 어렵다. 셋으로 나눠 두고 여기서 합친다.
 *
 * 아직 안 넣은 장은 비워 둔다 — 화면이 "준비 중"으로 알린다.
 */
const RAW: Partial<Record<number, string>> = {
  ...JOHN_1_4,
  ...JOHN_5_7,
  ...JOHN_8_11,
};

/** 「절번호 본문」 줄들을 절 배열로. 번호 없는 줄은 앞 절에 이어 붙인다 */
export function parseChapter(raw: string): BibleVerse[] {
  const verses: BibleVerse[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d{1,3})\s+(.+)$/);
    if (m) {
      verses.push({ n: Number(m[1]), text: m[2].trim() });
      continue;
    }
    // 번호가 없으면 앞 절의 이어지는 줄이다 (첫 줄부터 그러면 버린다)
    const last = verses[verses.length - 1];
    if (last) last.text = `${last.text} ${trimmed}`;
  }
  return verses;
}

/** 한 장. 본문이 아직 없으면 verses가 빈 배열이다 */
export function getChapter(n: number): BibleChapter | null {
  if (!(READING_CHAPTERS as readonly number[]).includes(n)) return null;
  return { n, verses: parseChapter(RAW[n] ?? "") };
}

/** 본문이 들어온 장 수 — 설정이 얼마나 찼는지 한눈에 */
export function readyChapterCount(): number {
  return READING_CHAPTERS.filter((n) => (RAW[n] ?? "").trim().length > 0).length;
}
