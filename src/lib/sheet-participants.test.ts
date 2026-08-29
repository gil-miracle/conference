import { describe, expect, it } from "vitest";
import { parseSheetParticipants, participantKey } from "./sheet-participants";

const HEADER = ["이름", "생년월일", "전화번호"];

describe("시트 머리글 찾기", () => {
  it("열 순서가 달라도 이름으로 찾는다", () => {
    const { rows, headers } = parseSheetParticipants([
      ["전화번호", "이름", "생년월일"],
      ["010-1234-5678", "김예찬", "19940101"],
    ]);
    expect(headers).toEqual({ name: "이름", birth: "생년월일", phone: "전화번호" });
    expect(rows).toEqual([
      { name: "김예찬", birth: "1994-01-01", phone: "010-1234-5678" },
    ]);
  });

  it("모르는 열이 섞여 있어도 된다", () => {
    const { rows } = parseSheetParticipants([
      ["번호", "이름", "성별", "생년월일", "소속", "휴대폰 번호", "비고"],
      ["1", "김예찬", "남", "1994.01.01", "GIL", "01012345678", "차량"],
    ]);
    expect(rows).toEqual([
      { name: "김예찬", birth: "1994-01-01", phone: "010-1234-5678" },
    ]);
  });

  it("위쪽 안내 문구를 건너뛰고 머리글 행을 찾는다", () => {
    const { rows, headers } = parseSheetParticipants([
      ["2026 컨퍼런스 참가자 명단"],
      [""],
      HEADER,
      ["김예찬", "19940101", "01012345678"],
    ]);
    expect(headers?.name).toBe("이름");
    expect(rows).toHaveLength(1);
  });

  it("영문 머리글도 읽는다", () => {
    const { rows } = parseSheetParticipants([
      ["name", "birth", "phone"],
      ["김예찬", "19940101", "01012345678"],
    ]);
    expect(rows).toHaveLength(1);
  });

  it("세 열을 다 못 찾으면 아무것도 읽지 않는다 — 엉뚱한 열을 이름으로 쓰면 안 된다", () => {
    const { rows, headers } = parseSheetParticipants([
      ["이름", "소속"],
      ["김예찬", "GIL"],
    ]);
    expect(headers).toBeNull();
    expect(rows).toEqual([]);
  });
});

describe("시트 행 읽기", () => {
  it("빈 줄은 오류로 세지 않는다", () => {
    const { rows, skipped } = parseSheetParticipants([
      HEADER,
      ["김예찬", "19940101", "01012345678"],
      [],
      ["", "", ""],
      ["이요셉", "19920302", "01022221234"],
    ]);
    expect(rows).toHaveLength(2);
    expect(skipped).toEqual([]);
  });

  it("값이 모자란 행은 이유와 함께 건너뛴다", () => {
    const { rows, skipped } = parseSheetParticipants([
      HEADER,
      ["김예찬", "19940101", "01012345678"],
      ["박누구", "날짜아님", "01011112222"],
      ["", "19900101", "01033334444"],
    ]);
    expect(rows).toHaveLength(1);
    expect(skipped).toHaveLength(2);
    expect(skipped[0].row).toBe(3);
    expect(skipped[0].reason).toContain("생년월일");
    expect(skipped[1].reason).toContain("이름 없음");
  });

  it("시트 안에서 같은 사람이 두 번 적히면 먼저 나온 행만 쓴다", () => {
    const { rows, skipped } = parseSheetParticipants([
      HEADER,
      ["김예찬", "19940101", "01012345678"],
      ["김예찬", "1994-01-01", "010-1234-5678"],
    ]);
    expect(rows).toHaveLength(1);
    expect(skipped[0].reason).toContain("중복");
  });

  it("생년월일·전화번호 표기가 달라도 같은 키가 된다", () => {
    const { rows } = parseSheetParticipants([
      HEADER,
      ["김예찬", "1994.01.01", "010 1234 5678"],
    ]);
    expect(participantKey(rows[0])).toBe(
      participantKey({ name: "김예찬", birth_date: "1994-01-01", phone: "010-1234-5678" })
    );
  });
});
