import { describe, expect, it } from "vitest";
import { parseParticipantsCsv } from "./csv";

/**
 * 명단 파싱은 조용히 틀리면 사람이 누락된다 — 그 사람은 가입 자체가 안 되고,
 * 행사 당일 체크인 데스크에서야 발견된다. 그래서 여기가 가장 중요한 테스트다.
 */
describe("parseParticipantsCsv", () => {
  it("쉼표 구분 기본 형식을 읽는다", () => {
    const { rows, skipped } = parseParticipantsCsv(
      "김예찬,19940101,010-1234-5678\n이요셉,19920302,010-2222-1234"
    );
    expect(skipped).toBe(0);
    expect(rows).toEqual([
      { name: "김예찬", birth: "1994-01-01", phone: "010-1234-5678" },
      { name: "이요셉", birth: "1992-03-02", phone: "010-2222-1234" },
    ]);
  });

  it("엑셀에서 복사한 탭 구분도 읽는다", () => {
    const { rows } = parseParticipantsCsv("김예찬\t19940101\t01012345678");
    expect(rows).toHaveLength(1);
    expect(rows[0].birth).toBe("1994-01-01");
  });

  it("생년월일 표기 3종을 모두 같은 값으로 정규화한다", () => {
    const { rows } = parseParticipantsCsv(
      ["가,19940101,01011112222", "나,1994-01-01,01011112222", "다,1994.01.01,01011112222"].join("\n")
    );
    expect(rows.map((r) => r.birth)).toEqual(["1994-01-01", "1994-01-01", "1994-01-01"]);
  });

  it("헤더 행은 건너뛰되 skipped로 세지 않는다", () => {
    const kr = parseParticipantsCsv("이름,생년월일,전화번호\n김예찬,19940101,01012345678");
    expect(kr.rows).toHaveLength(1);
    expect(kr.skipped).toBe(0);

    const en = parseParticipantsCsv("name,birth,phone\n김예찬,19940101,01012345678");
    expect(en.rows).toHaveLength(1);
    expect(en.skipped).toBe(0);
  });

  it("큰따옴표로 감싼 셀의 따옴표를 벗긴다", () => {
    const { rows } = parseParticipantsCsv('"김예찬","19940101","010-1234-5678"');
    expect(rows[0]).toEqual({
      name: "김예찬",
      birth: "1994-01-01",
      phone: "010-1234-5678",
    });
  });

  it("빈 줄은 무시하고 skipped에 세지 않는다", () => {
    const { rows, skipped } = parseParticipantsCsv(
      "\n김예찬,19940101,01012345678\n\n   \n"
    );
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(0);
  });

  it("깨진 행은 버리되 반드시 세어서 알려준다", () => {
    const { rows, skipped } = parseParticipantsCsv(
      [
        "김예찬,19940101,01012345678", // 정상
        "열이없음", // 열 부족
        "생일짧음,940101,01012345678", // 8자리 아님
        ",19940101,01012345678", // 이름 없음
        "전화없음,19940101,", // 전화 없음
      ].join("\n")
    );
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(4); // 조용히 사라지면 안 된다
  });

  it("CRLF(윈도우 엑셀) 줄바꿈을 처리한다", () => {
    const { rows } = parseParticipantsCsv(
      "김예찬,19940101,01012345678\r\n이요셉,19920302,01022221234\r\n"
    );
    expect(rows).toHaveLength(2);
  });

  it("4번째 열이 더 있어도 앞 3개만 쓴다", () => {
    const { rows, skipped } = parseParticipantsCsv("김예찬,19940101,01012345678,비고");
    expect(skipped).toBe(0);
    expect(rows[0].name).toBe("김예찬");
  });
});
