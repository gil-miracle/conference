import type { AdminParticipant } from "./types";
import { isStaff } from "./participant-fields";

/** 010-****-1234 형태로 마스킹 */
export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length < 7) return phone;
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}

// 서버(UTC 호스팅)와 클라이언트 어디서 렌더돼도 행사 시간대(KST)로 표시
const KST_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function kst(iso: string) {
  const parts = KST_PARTS.formatToParts(new Date(iso));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return { MM: get("month"), DD: get("day"), hh: get("hour"), mm: get("minute") };
}

/** 08.19 21:40 (KST) */
export function fmtDateTime(iso: string) {
  const p = kst(iso);
  return `${p.MM}.${p.DD} ${p.hh}:${p.mm}`;
}

/** 16:32 (KST) */
export function fmtTime(iso: string) {
  const p = kst(iso);
  return `${p.hh}:${p.mm}`;
}

/** 1994.01.01 */
export function fmtBirth(iso: string) {
  return iso.slice(0, 10).replaceAll("-", ".");
}

/** "19940101" → "1994-01-01", 잘못된 날짜면 null */
export function parseBirth8(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(4, 6));
  const day = Number(d.slice(6, 8));
  if (y < 1900 || y > 2030 || m < 1 || m > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, day));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== day) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

/** 숫자만 남긴 전화번호를 010-1234-5678 형태로 */
export function normalizePhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw.trim();
}

/** 다락방이 없는 사람은 초청 받아 온 지체다 */
export const INVITED = "초청자";

/**
 * 명단 한 줄에 붙는 소속 배지.
 *
 * 다락방이 있으면 다락방, 없으면서 초청 흔적이 있으면 "초청자".
 * 목록과 필터가 같은 판단을 쓰도록 여기 한 곳에 둔다 — 갈라지면
 * 초청자로 걸렀는데 배지 없는 사람이 섞여 나오는 일이 생긴다.
 */
export function groupTag(
  p: Pick<AdminParticipant, "cell_group" | "inviter" | "applicant_type">
): string | null {
  // 교역자·멘토는 다락방에 매이지 않는다. 체크인 버튼도 없는 줄이라 표식까지
  // 없으면 왜 다른지 알 수가 없다
  if (isStaff(p.applicant_type)) return p.applicant_type;
  if (p.cell_group) return p.cell_group;
  return p.inviter || p.applicant_type?.includes("초청") ? INVITED : null;
}
