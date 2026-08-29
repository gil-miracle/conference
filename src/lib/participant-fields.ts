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
  { key: "gender", label: "성별" },
  { key: "cell_group", label: "다락방" },
  { key: "inviter", label: "초청자" },
  { key: "transport", label: "오는 방법" },
  { key: "arrive_day", label: "도착 요일" },
  { key: "arrive_time", label: "도착 시간" },
  { key: "stay", label: "숙박일" },
  { key: "tshirt", label: "티셔츠" },
];

/**
 * 신청서에 없는 유형 — 교역자·멘토는 신청을 받지 않고 우리가 넣는다.
 *
 * 두 분류를 한 칸에 묶지 않는다. 방 배정도 역할도 다르게 보게 되는 자리다.
 */
export const STAFF_TYPES = ["교역자", "멘토"];

/** 교역자·멘토에게는 해당이 없는 항목 — 물어볼 것도, 채울 것도 없다 */
export const STAFF_HIDDEN: (keyof SignupInfo)[] = ["cell_group", "inviter"];

/** 섬기러 오는 분들 — 체크인도 참석 인원 집계도 하지 않는다 */
export const isStaff = (applicantType: string | null) =>
  STAFF_TYPES.includes(applicantType ?? "");
