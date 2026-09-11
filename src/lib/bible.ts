/**
 * 성경 통독 본문.
 *
 * 조영찬 전도사님 시간(MIRACLE 2)에 마가복음 1~10장을 함께 읽는다.
 *
 * 본문은 아래 RAW에 **줄마다 「절번호 한 칸 본문」** 으로 넣는다. 절 객체를
 * 손으로 쓰게 하면 423절을 옮기다 어딘가 틀리고, 틀린 것이 성경 본문이면
 * 알아채기도 어렵다. 붙여넣은 모양 그대로 받아 코드가 나눈다.
 *
 *     1 하나님의 아들 예수 그리스도에 관한 복음은 이렇게 시작됩니다.
 *     2 예언자 이사야의 글에…
 *
 * 절 번호로 시작하지 않는 줄은 앞 절에 이어 붙는다 — 한 절이 여러 줄로
 * 끊겨 붙여넣어져도 절이 쪼개지지 않는다.
 */

import { MARK_1_4 } from "./bible/mark-1-4";
import { MARK_5_7 } from "./bible/mark-5-7";
import { MARK_8_10 } from "./bible/mark-8-10";
import { CHRONICLES_1_3 } from "./bible/chronicles-1-3";

export type BibleVerse = { n: number; text: string };
export type BibleChapter = { n: number; verses: BibleVerse[] };

/** 통독 범위 — 마가복음 1~10장 */
export const READING_BOOK = "마가복음";
export const READING_TRANSLATION = "우리말성경";
export const READING_CHAPTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * 장별 본문. 한 파일에 열 장을 다 넣으면 열 때마다 화면이 통째로 흔들려
 * 고칠 데를 찾기 어렵다. 셋으로 나눠 두고 여기서 합친다.
 *
 * 아직 안 넣은 장은 비워 둔다 — 화면이 "준비 중"으로 알린다.
 */
const RAW: Partial<Record<number, string>> = {
  ...MARK_1_4,
  ...MARK_5_7,
  ...MARK_8_10,
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

/**
 * 여러 장짜리 아침 QT 본문 — 마가복음 통독처럼 한 장씩 좌우로 넘긴다.
 *
 * 셋째 날 QT는 역대상 1~3장이다. 마가복음 통독과 같은 「절번호 본문」 원문을
 * 같은 파서로 나눈다. QT 본문(content.ts)에 넣지 않는 것은 133절이 참가자
 * 화면 번들에 실려 나가지 않게 하려는 것이다 — 이 표는 QT 페이지(서버)만
 * 읽는다. 묵상·기도는 content.ts의 그날 qt에 그대로 있다.
 */
export type QtReading = {
  book: string;
  chapters: BibleChapter[];
};

const QT_READINGS: Record<string, { book: string; raw: Record<number, string> }> = {
  "3": { book: "역대상", raw: CHRONICLES_1_3 },
};

/** 그날 QT의 여러 장 본문 — 없는 날은 null */
export function getQtReading(day: string): QtReading | null {
  const found = QT_READINGS[day];
  if (!found) return null;
  const chapters = Object.keys(found.raw)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => ({ n, verses: parseChapter(found.raw[n] ?? "") }));
  return { book: found.book, chapters };
}

/** 본문이 들어온 장 수 — 설정이 얼마나 찼는지 한눈에 */
export function readyChapterCount(): number {
  return READING_CHAPTERS.filter((n) => (RAW[n] ?? "").trim().length > 0).length;
}
