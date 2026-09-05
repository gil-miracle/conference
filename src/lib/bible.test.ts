import { describe, expect, it } from "vitest";
import { getChapter, parseChapter, READING_CHAPTERS } from "./bible";

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
    const v = parseChapter("6 거기 돌항아리 여섯이 있었는데 두세 통 드는 것이었습니다.");
    expect(v).toHaveLength(1);
    expect(v[0]).toEqual({
      n: 6,
      text: "거기 돌항아리 여섯이 있었는데 두세 통 드는 것이었습니다.",
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
  it("요한복음 1~11장만 연다", () => {
    expect(READING_CHAPTERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(getChapter(1)).not.toBeNull();
    expect(getChapter(11)).not.toBeNull();
    expect(getChapter(12)).toBeNull();
    expect(getChapter(0)).toBeNull();
  });
});
