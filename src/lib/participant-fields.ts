import type { SignupInfo } from "./types";

/**
 * 신청서에서 오는 항목들.
 *
 * 상세 보기·수정 폼·필터가 같은 순서와 같은 이름을 쓰도록 한 곳에 둔다.
 *
 * 값은 시트에서 자유 문구로 들어오므로 고정 선택지를 두지 않는다 — 신청 폼
 * 문구가 한 번 바뀌면 코드가 따라가지 못하고, 못 고르는 값이 생긴다.
 * 대신 이미 명단에 쓰인 값을 후보로 보여준다.
 */
export const SIGNUP_FIELDS: { key: keyof SignupInfo; label: string }[] = [
  { key: "applicant_type", label: "유형" },
  { key: "cell_group", label: "다락방" },
  { key: "inviter", label: "초청자" },
  { key: "transport", label: "오는 방법" },
  { key: "arrive_day", label: "도착 요일" },
  { key: "arrive_time", label: "도착 시간" },
  { key: "stay", label: "숙박일" },
  { key: "tshirt", label: "티셔츠" },
];
