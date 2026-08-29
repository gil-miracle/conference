import { describe, expect, it } from "vitest";
import { parseSheetParticipants, participantKey } from "./sheet-participants";

const HEADER = ["이름", "생년월일", "전화번호"];

describe("시트 머리글 찾기", () => {
  it("열 순서가 달라도 이름으로 찾는다", () => {
    const { rows, headers } = parseSheetParticipants([
      ["전화번호", "이름", "생년월일"],
      ["010-1234-5678", "김예찬", "19940101"],
    ]);
    expect(headers?.find((h) => h.field === "name")?.columns).toEqual(["B 이름"]);
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
      { name: "김예찬", birth: "1994-01-01", phone: "010-1234-5678", gender: "남" },
    ]);
  });

  it("성별은 1/2로 들어와도 남/여로 편다", () => {
    const rowsOf = (g: string) =>
      parseSheetParticipants([
        ["이름", "생년월일", "휴대폰 번호", "성별"],
        ["김예찬", "1994.01.01", "01012345678", g],
      ]).rows;
    expect(rowsOf("1")[0].gender).toBe("남");
    expect(rowsOf("2")[0].gender).toBe("여");
    expect(rowsOf("여자")[0].gender).toBe("여");
    // 모르는 값은 비운다 — DB 제약에 걸리면 그 사람이 통째로 빠진다
    expect(rowsOf("3")[0].gender).toBeUndefined();
    expect(rowsOf("")[0].gender).toBeUndefined();
  });

  it("위쪽 안내 문구를 건너뛰고 머리글 행을 찾는다", () => {
    const { rows, headers } = parseSheetParticipants([
      ["2026 컨퍼런스 참가자 명단"],
      [""],
      HEADER,
      ["김예찬", "19940101", "01012345678"],
    ]);
    expect(headers?.some((h) => h.field === "name")).toBe(true);
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

/* 실제 구글 폼 응답 시트의 모양 — 여기서 어긋나면 동기화가 조용히 틀린다 */
const CONSENT =
  "2-5. 개인정보 활용 동의\n[개인정보보호법] 등 관련 법규에 의거하여\n" +
  "1) 개인 정보 수집 항목: 이름, 연락처, 주민등록번호";

const FORM_HEADER = [
  "타임스탬프",
  "1. 신청자의 유형을 선택해 주세요.",
  "2-1. 신청자의 이름을 작성해 주세요.",
  "2-2. 신청자의 연락처를 작성해 주세요.",
  "2-3. 신청자의 주민등록번호를 작성해 주세요.",
  "2-4. 소속 다락방을 선택해 주세요.",
  CONSENT,
  "2-1. 신청자의 이름을 작성해 주세요.",
  "2-3. 신청자의 연락처를 작성해 주세요.",
  "2-4. 신청자의 주민등록번호를 작성해 주세요.",
  "2-5. 본인을 초청한 사람의 이름을 작성해 주세요.",
  CONSENT,
  "3-1. 컨퍼런스 장소까지 오시는 방법을 선택해 주세요.",
  "3-2. 컨퍼런스 도착 요일을 선택해 주세요.",
  "3-3. 컨퍼런스 도착 시간을 작성해 주세요.",
  "3-4. 숙박일을 선택해 주세요.",
  "4-1. 단체 티셔츠 사이즈를 선택해 주세요.",
  "4-2. 컨퍼런스 신청 기간에 따른 회비를 확인하셨습니까?",
  "2-2. 신청자의 성별을 선택해 주세요.",
  "",
  "생년월일",
];

/** 내부(길 공동체) 신청자 한 줄 */
const inside = (over: Record<number, string> = {}) => {
  const r = new Array(21).fill("");
  r[0] = "2026. 8. 9 오후 1:52:24";
  r[1] = "길 공동체 지체";
  r[2] = "정현기";
  r[3] = "010-5162-8653";
  r[5] = "BEGIN";
  r[6] = "동의합니다.";
  r[12] = "자차 >>> 3-2 질문으로";
  r[13] = "9월 11일(금)";
  r[15] = "9월 11일(금), 9월 12일(토)";
  r[16] = "XXXL";
  r[20] = "941108";
  return Object.assign(r, over);
};

describe("폼 응답 시트", () => {
  it("동의문 머리글이 이름·연락처를 가로채지 않는다", () => {
    const { rows, headers } = parseSheetParticipants([FORM_HEADER, inside()]);
    // 동의문(G·L)에도 "이름, 연락처"가 들어 있지만 첫 줄만 보므로 안 걸린다
    expect(headers?.find((h) => h.field === "name")?.columns).toEqual([
      "C 2-1. 신청자의 이름을 작성해 주세요.",
      "H 2-1. 신청자의 이름을 작성해 주세요.",
    ]);
    expect(rows[0].name).toBe("정현기");
  });

  it("초청자 열이 이름 후보에서 빠진다", () => {
    const { headers } = parseSheetParticipants([FORM_HEADER, inside()]);
    expect(headers?.find((h) => h.field === "inviter")?.columns).toEqual([
      "K 2-5. 본인을 초청한 사람의 이름을 작성해 주세요.",
    ]);
    expect(
      headers?.find((h) => h.field === "name")?.columns.some((c) => c.startsWith("K"))
    ).toBe(false);
  });

  it("내부 열이 비면 초청 신청자 열에서 읽는다", () => {
    const outside = inside({ 1: "초청 받은 지체", 2: "", 3: "", 5: "" });
    outside[7] = "김초청";
    outside[8] = "010-9999-8888";
    outside[10] = "정현기";
    const { rows } = parseSheetParticipants([FORM_HEADER, outside]);
    expect(rows[0]).toMatchObject({
      name: "김초청",
      phone: "010-9999-8888",
      inviter: "정현기",
      applicantType: "초청 받은 지체",
    });
  });

  it("생년월일 6자리를 네 자리 연도로 편다", () => {
    const { rows } = parseSheetParticipants([FORM_HEADER, inside()]);
    expect(rows[0].birth).toBe("1994-11-08");

    const young = parseSheetParticipants([FORM_HEADER, inside({ 20: "050301" })]);
    expect(young.rows[0].birth).toBe("2005-03-01");
  });

  it("공동체 버스면 비어 있는 도착 요일·시간을 채운다", () => {
    const bus = inside({
      12: "공동체 버스(9/11(금) 오후 7시30분, 혜화 이룸에서 출발 예정) >>> 3-4 질문으로",
      13: "",
    });
    const { rows } = parseSheetParticipants([FORM_HEADER, bus]);
    expect(rows[0].arriveDay).toBe("9월 11일(금)");
    expect(rows[0].arriveTime).toBe("오후 7시 30분");
  });

  it("폼 분기 안내(>>>)를 떼어낸다", () => {
    const { rows } = parseSheetParticipants([FORM_HEADER, inside()]);
    expect(rows[0].transport).toBe("자차");
  });

  it("나머지 신청 정보를 함께 읽는다", () => {
    const { rows } = parseSheetParticipants([FORM_HEADER, inside()]);
    expect(rows[0]).toMatchObject({
      applicantType: "길 공동체 지체",
      cellGroup: "BEGIN",
      stay: "9월 11일(금), 9월 12일(토)",
      tshirt: "XXXL",
    });
  });
});
