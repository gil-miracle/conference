import { describe, expect, it } from "vitest";
import {
  getChapter,
  getQtReading,
  parseChapter,
  readyChapterCount,
  READING_CHAPTERS,
} from "./bible";

describe("통독 본문 나누기", () => {
  it("줄마다 절번호를 떼어 낸다", () => {
    expect(parseChapter("1 태초에 말씀이 계셨습니다.\n2 그분은 함께 계셨습니다."))
      .toEqual([
        { n: 1, text: "태초에 말씀이 계셨습니다." },
        { n: 2, text: "그분은 함께 계셨습니다." },
      ]);
  });

  it("번호 없는 줄은 앞 절에 이어 붙인다 — 붙여넣다 끊긴 절이 쪼개지지 않게", () => {
    expect(parseChapter("1 태초에 말씀이 계셨고\n이 말씀이 하나님과 함께 계셨으니\n2 그분은")).
      toEqual([
        { n: 1, text: "태초에 말씀이 계셨고 이 말씀이 하나님과 함께 계셨으니" },
        { n: 2, text: "그분은" },
      ]);
  });

  it("본문 안의 숫자를 절번호로 오해하지 않는다", () => {
    const v = parseChapter("8 어떤 씨는 좋은 땅에 떨어져 30배, 60배, 100배의 열매를 맺었다.");
    expect(v).toHaveLength(1);
    expect(v[0]).toEqual({
      n: 8,
      text: "어떤 씨는 좋은 땅에 떨어져 30배, 60배, 100배의 열매를 맺었다.",
    });
  });

  it("빈 줄과 앞뒤 공백을 버린다", () => {
    expect(parseChapter("\n  1   태초에 말씀이 계셨습니다.  \n\n")).toEqual([
      { n: 1, text: "태초에 말씀이 계셨습니다." },
    ]);
  });

  it("본문이 없으면 빈 절 목록 — 화면이 '준비 중'으로 알린다", () => {
    expect(parseChapter("")).toEqual([]);
  });
});

describe("통독 범위", () => {
  it("마가복음 1~10장만 연다", () => {
    expect(READING_CHAPTERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(getChapter(1)).not.toBeNull();
    expect(getChapter(10)).not.toBeNull();
    expect(getChapter(11)).toBeNull();
    expect(getChapter(0)).toBeNull();
  });

  it("열 장이 다 들어와 있다", () => {
    expect(readyChapterCount()).toBe(10);
  });
});

describe("QT 통독", () => {
  it("둘째 날은 역대상 1~3장 — 절 수가 원문(54·55·24)과 같다", () => {
    const r = getQtReading("2");
    expect(r?.book).toBe("역대상");
    expect(r?.chapters.map((c) => c.n)).toEqual([1, 2, 3]);
    expect(r?.chapters.map((c) => c.verses.length)).toEqual([54, 55, 24]);
    // 절번호가 1부터 빠짐없이 이어진다 — 붙여넣다 한 절이 빠지면 여기서 걸린다
    for (const c of r?.chapters ?? [])
      expect(c.verses.map((v) => v.n)).toEqual(c.verses.map((_, i) => i + 1));
  });

  it("통독이 없는 날은 null", () => {
    expect(getQtReading("3")).toBeNull();
  });
});
