import { describe, expect, it } from "vitest";
import {
  fmtBirth,
  fmtDateTime,
  fmtTime,
  maskPhone,
  normalizePhone,
  parseBirth8,
} from "./format";

describe("parseBirth8", () => {
  it("8자리를 ISO 날짜로 바꾼다", () => {
    expect(parseBirth8("19940101")).toBe("1994-01-01");
  });

  it("하이픈·점이 섞여 있어도 숫자만 뽑아 쓴다", () => {
    expect(parseBirth8("1994-01-01")).toBe("1994-01-01");
    expect(parseBirth8("1994.01.01")).toBe("1994-01-01");
  });

  it("자릿수가 안 맞으면 null", () => {
    expect(parseBirth8("940101")).toBeNull();
    expect(parseBirth8("199401011")).toBeNull();
    expect(parseBirth8("")).toBeNull();
  });

  it("존재하지 않는 날짜를 걸러낸다", () => {
    expect(parseBirth8("19940230")).toBeNull(); // 2월 30일
    expect(parseBirth8("19941301")).toBeNull(); // 13월
    expect(parseBirth8("19940100")).toBeNull(); // 0일
  });

  it("윤년 2월 29일은 통과, 평년은 거부", () => {
    expect(parseBirth8("20000229")).toBe("2000-02-29");
    expect(parseBirth8("19000229")).toBeNull(); // 1900은 윤년이 아니다
    expect(parseBirth8("20010229")).toBeNull();
  });

  it("상식 밖 연도는 거부", () => {
    expect(parseBirth8("18991231")).toBeNull();
    expect(parseBirth8("20310101")).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("11자리를 010-1234-5678로", () => {
    expect(normalizePhone("01012345678")).toBe("010-1234-5678");
    expect(normalizePhone("010 1234 5678")).toBe("010-1234-5678");
    expect(normalizePhone("010-1234-5678")).toBe("010-1234-5678");
  });

  it("10자리를 010-123-4567로", () => {
    expect(normalizePhone("0101234567")).toBe("010-123-4567");
  });

  it("길이가 안 맞으면 원본을 다듬어 그대로 둔다", () => {
    expect(normalizePhone("  123  ")).toBe("123");
  });
});

describe("maskPhone", () => {
  it("가운데를 가린다", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-****-5678");
    expect(maskPhone("01012345678")).toBe("010-****-5678");
  });

  it("너무 짧으면 원본을 그대로 (가릴 게 없다)", () => {
    expect(maskPhone("12345")).toBe("12345");
  });
});

describe("fmtBirth", () => {
  it("점 표기로 바꾼다", () => {
    expect(fmtBirth("1994-01-01")).toBe("1994.01.01");
    expect(fmtBirth("1994-01-01T00:00:00Z")).toBe("1994.01.01");
  });
});

describe("KST 고정 표시", () => {
  // 서버는 UTC로 도는데 행사는 한국이다 — 어디서 렌더돼도 KST여야 한다
  it("UTC 자정은 KST 09:00", () => {
    expect(fmtTime("2026-09-11T00:00:00Z")).toBe("09:00");
  });

  it("날짜 경계를 넘어간다", () => {
    // UTC 9/11 16:00 = KST 9/12 01:00
    expect(fmtDateTime("2026-09-11T16:00:00Z")).toBe("09.12 01:00");
  });

  it("24시간 표기를 쓴다 (오후 1시가 01이 되면 안 된다)", () => {
    // UTC 04:00 = KST 13:00
    expect(fmtTime("2026-09-11T04:00:00Z")).toBe("13:00");
  });

  it("자정은 00:00 (24:00이 아니다)", () => {
    // UTC 15:00 = KST 00:00
    expect(fmtTime("2026-09-11T15:00:00Z")).toBe("00:00");
  });
});
