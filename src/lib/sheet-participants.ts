import { normalizePhone, parseBirth8 } from "./format";

/**
 * 구글 시트 → 참가자 명단.
 *
 * 열 순서를 고정하지 않고 **머리글 이름으로 찾는다.** 시트는 사람이 쓰는
 * 문서라 열이 늘고 순서가 바뀐다 — 그때마다 코드를 고치게 하면 안 된다.
 * 인식한 매핑은 화면에 보여줘 어긋나면 바로 드러나게 한다.
 */

export type SheetParticipant = { name: string; birth: string; phone: string };

export type SheetMapping = { name: number; birth: number; phone: number };

export type SheetParseResult = {
  rows: SheetParticipant[];
  /** 어느 열을 무엇으로 읽었는지 — 화면에 그대로 보여준다 */
  headers: { name: string; birth: string; phone: string } | null;
  /** 머리글은 찾았는데 값이 모자라 건너뛴 행 */
  skipped: { row: number; reason: string }[];
};

/** 머리글 후보. 공백·괄호를 지우고 비교하므로 "휴대폰 번호"도 "휴대폰"에 걸린다 */
const ALIASES = {
  name: ["이름", "성명", "참가자", "name"],
  birth: ["생년월일", "생일", "출생", "birth", "birthday", "birthdate", "dob"],
  phone: ["전화번호", "전화", "휴대폰", "핸드폰", "연락처", "phone", "mobile", "tel"],
} as const;

const norm = (s: string) => s.replace(/[\s()[\]{}·:_-]/g, "").toLowerCase();

function findColumn(header: string[], keys: readonly string[]): number {
  const cells = header.map(norm);
  // 완전히 같은 것부터 — "이름"이 "이름표"보다 먼저 걸려야 한다
  const exact = cells.findIndex((c) => keys.some((k) => c === norm(k)));
  if (exact >= 0) return exact;
  return cells.findIndex((c) => c && keys.some((k) => c.includes(norm(k))));
}

/**
 * 머리글 행을 찾는다.
 * 시트 맨 위에 제목·안내 문구가 있는 경우가 흔해서 첫 행을 그냥 믿지 않고,
 * 이름·생년월일·전화 세 열이 모두 잡히는 첫 행을 머리글로 본다.
 */
function locateHeader(values: string[][]) {
  const limit = Math.min(values.length, 10);
  for (let i = 0; i < limit; i++) {
    const row = values[i] ?? [];
    const map: SheetMapping = {
      name: findColumn(row, ALIASES.name),
      birth: findColumn(row, ALIASES.birth),
      phone: findColumn(row, ALIASES.phone),
    };
    if (map.name >= 0 && map.birth >= 0 && map.phone >= 0)
      return { index: i, map, row };
  }
  return null;
}

export function parseSheetParticipants(values: string[][]): SheetParseResult {
  const found = locateHeader(values);
  if (!found) return { rows: [], headers: null, skipped: [] };

  const { index, map, row: header } = found;
  const rows: SheetParticipant[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const seen = new Set<string>();

  for (let i = index + 1; i < values.length; i++) {
    const cells = values[i] ?? [];
    const name = (cells[map.name] ?? "").trim();
    const birthRaw = (cells[map.birth] ?? "").trim();
    const phoneRaw = (cells[map.phone] ?? "").trim();

    // 셋 다 비면 그냥 빈 줄 — 오류로 셀 것도 없다
    if (!name && !birthRaw && !phoneRaw) continue;

    if (!name) {
      skipped.push({ row: i + 1, reason: "이름 없음" });
      continue;
    }
    const birth = parseBirth8(birthRaw);
    if (!birth) {
      skipped.push({ row: i + 1, reason: `${name} — 생년월일 형식` });
      continue;
    }
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      skipped.push({ row: i + 1, reason: `${name} — 전화번호 없음` });
      continue;
    }

    // 시트에서 같은 사람이 두 번 적히는 일이 있다 — 먼저 나온 행만 쓴다
    const key = `${name}|${birth}|${phone}`;
    if (seen.has(key)) {
      skipped.push({ row: i + 1, reason: `${name} — 시트 안 중복` });
      continue;
    }
    seen.add(key);
    rows.push({ name, birth, phone });
  }

  return {
    rows,
    headers: {
      name: header[map.name] ?? "",
      birth: header[map.birth] ?? "",
      phone: header[map.phone] ?? "",
    },
    skipped,
  };
}

/** 참가자 한 명을 가리키는 키 — DB의 유니크 제약(name, birth_date, phone)과 같다 */
export const participantKey = (p: {
  name: string;
  birth_date?: string;
  birth?: string;
  phone: string;
}) => `${p.name}|${p.birth_date ?? p.birth}|${p.phone}`;
