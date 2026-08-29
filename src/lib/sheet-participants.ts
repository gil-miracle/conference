import { normalizePhone, parseBirth8 } from "./format";

/**
 * 구글 시트(폼 응답) → 참가자 명단.
 *
 * 열 순서를 고정하지 않고 **머리글 이름으로 찾는다.** 시트는 사람이 쓰는
 * 문서라 열이 늘고 순서가 바뀐다 — 그때마다 코드를 고치게 하면 안 된다.
 * 인식한 매핑은 화면에 보여줘 어긋나면 바로 드러나게 한다.
 *
 * 폼 응답 시트에는 두 가지 함정이 있어 그걸 피하도록 짜여 있다.
 *
 * ① **머리글이 여러 줄이다.** 개인정보 동의 항목의 머리글에는 안내문이
 *    통째로 들어가 있고 그 안에 "이름, 연락처, 주민등록번호"라는 글자가 있다.
 *    통으로 비교하면 동의문 열이 이름 열로 잡힌다 → **첫 줄만 본다.**
 *
 * ② **같은 질문이 분기마다 반복된다.** 내부 신청자와 초청 신청자가 각각
 *    이름·연락처 열을 갖는다(둘 중 한쪽만 채워진다) → **여러 열을 모아
 *    행마다 비어 있지 않은 첫 값을 쓴다.**
 *    "초청한 사람의 이름"처럼 남의 그룹에 걸릴 머리글은 더 구체적인 항목이
 *    **먼저 선점**해 이름 후보에서 빠진다.
 */

export type SheetParticipant = {
  name: string;
  birth: string;
  phone: string;
  /** 신청자 유형 — 길 공동체 지체 / 초청 받은 지체 */
  applicantType?: string;
  /** 성별 — 시트는 1/2로 받고 여기서 남/여로 편다 */
  gender?: string;
  /** 소속 다락방 (길 공동체 지체만) */
  cellGroup?: string;
  /** 초청자 이름 (초청 받은 지체만) */
  inviter?: string;
  /** 오는 방법 */
  transport?: string;
  /** 도착 요일 */
  arriveDay?: string;
  /** 도착 시간 */
  arriveTime?: string;
  /** 숙박일 */
  stay?: string;
  /** 단체 티셔츠 사이즈 */
  tshirt?: string;
};

type FieldKey = keyof SheetParticipant;

export type SheetParseResult = {
  rows: SheetParticipant[];
  /** 어느 항목을 어느 머리글로 읽었는지 — 화면에 그대로 보여준다 */
  headers: { field: FieldKey; label: string; columns: string[] }[] | null;
  /** 머리글은 찾았는데 값이 모자라 건너뛴 행 */
  skipped: { row: number; reason: string }[];
};

/**
 * 찾을 항목들. **순서가 곧 우선순위**다 — 앞선 항목이 열을 선점하고,
 * 뒤 항목은 남은 열에서만 고른다. "초청한 사람의 이름"이 이름보다 앞에 있는 게
 * 그래서다.
 */
const FIELDS: { key: FieldKey; label: string; aliases: string[]; required?: boolean }[] = [
  { key: "birth", label: "생년월일", required: true, aliases: ["생년월일", "생일", "출생", "birth", "birthday", "birthdate", "dob"] },
  { key: "inviter", label: "초청자", aliases: ["초청"] },
  { key: "tshirt", label: "티셔츠", aliases: ["티셔츠", "옷사이즈", "tshirt"] },
  { key: "transport", label: "오는 방법", aliases: ["오시는방법", "오는방법", "교통", "이동수단"] },
  { key: "arriveDay", label: "도착 요일", aliases: ["도착요일"] },
  { key: "arriveTime", label: "도착 시간", aliases: ["도착시간"] },
  { key: "stay", label: "숙박일", aliases: ["숙박"] },
  { key: "cellGroup", label: "다락방", aliases: ["다락방", "구역", "셀"] },
  { key: "applicantType", label: "유형", aliases: ["유형", "구분"] },
  { key: "gender", label: "성별", aliases: ["성별", "gender", "sex"] },
  { key: "name", label: "이름", required: true, aliases: ["이름", "성명", "참가자", "name"] },
  { key: "phone", label: "연락처", required: true, aliases: ["전화번호", "전화", "휴대폰", "핸드폰", "연락처", "phone", "mobile", "tel"] },
];

/** 머리글 비교용 정규화 — 첫 줄만 쓰고 공백·기호를 지운다 */
const norm = (s: string) =>
  (s ?? "").split("\n")[0].replace(/[\s()[\]{}·:_.,-]/g, "").toLowerCase();

/** 별칭에 걸리는 열을 **모두** 찾는다 (분기마다 반복되는 질문 때문에) */
function findColumns(header: string[], aliases: string[], taken: Set<number>): number[] {
  const cells = header.map(norm);
  const keys = aliases.map(norm);
  const pick = (test: (c: string) => boolean) =>
    cells.flatMap((c, i) => (c && !taken.has(i) && test(c) ? [i] : []));

  // 완전히 같은 머리글이 있으면 그것만 쓴다 — "생년월일"이 "주민등록번호"보다 정확하다
  const exact = pick((c) => keys.some((k) => c === k));
  return exact.length > 0 ? exact : pick((c) => keys.some((k) => c.includes(k)));
}

type Mapping = { field: FieldKey; label: string; columns: number[]; required: boolean };

/**
 * 머리글 행을 찾는다.
 * 시트 맨 위에 제목·안내 문구가 있는 경우가 흔해서 첫 행을 그냥 믿지 않고,
 * 필수 세 항목이 모두 잡히는 첫 행을 머리글로 본다.
 */
function locateHeader(values: string[][]) {
  const limit = Math.min(values.length, 10);
  for (let i = 0; i < limit; i++) {
    const row = values[i] ?? [];
    const taken = new Set<number>();
    const maps: Mapping[] = [];
    for (const f of FIELDS) {
      const columns = findColumns(row, f.aliases, taken);
      for (const c of columns) taken.add(c);
      if (columns.length > 0)
        maps.push({ field: f.key, label: f.label, columns, required: Boolean(f.required) });
    }
    const haveAllRequired = FIELDS.filter((f) => f.required).every((f) =>
      maps.some((m) => m.field === f.key)
    );
    if (haveAllRequired) return { index: i, maps, row };
  }
  return null;
}

/**
 * 두 자리 연도를 네 자리로 편다.
 * 주민번호 앞 6자리를 그대로 받으면 1994인지 2094인지 알 수 없어, 올해를
 * 넘지 않는 쪽으로 고른다 — 아직 태어나지 않은 사람은 명단에 없다.
 */
export function expandBirth(raw: string, year = new Date().getFullYear()): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length !== 6) return raw ?? "";
  const yy = Number(d.slice(0, 2));
  return (yy <= year % 100 ? "20" : "19") + d;
}

/**
 * 성별 — 시트에 주민번호 뒷자리 첫 숫자로 들어온다.
 *
 * 1·3이 남자, 2·4가 여자다(1900년대생과 2000년대생). 2000년 이후 태어난
 * 사람이 3·4로 들어오는데, 1·2만 보면 그 사람들이 통째로 비게 된다.
 *
 * 남/여를 그대로 적어 넣는 사람도 있을 수 있어 그 경우도 받는다. 아는 값이
 * 아니면 비운다 — 모르는 값을 넣으면 DB 제약에 걸려 그 사람이 통째로 빠진다.
 */
function readGender(raw: string): string | undefined {
  const v = (raw ?? "").trim();
  if (v === "1" || v === "3" || v.startsWith("남")) return "남";
  if (v === "2" || v === "4" || v.startsWith("여")) return "여";
  return undefined;
}

/** 폼 분기 안내(">>> 3-4 질문으로")를 떼어 사람이 읽을 값만 남긴다 */
const clean = (s: string) => (s ?? "").split(">>>")[0].trim();

/** 공동체 버스는 출발 시각이 정해져 있어 응답에 도착 요일·시간이 비어 있다 */
const BUS = { day: "9월 11일(금)", time: "오후 7시 30분" };

export function parseSheetParticipants(values: string[][]): SheetParseResult {
  const found = locateHeader(values);
  if (!found) return { rows: [], headers: null, skipped: [] };

  const { index, maps, row: header } = found;
  const rows: SheetParticipant[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const seen = new Set<string>();

  /** 그 항목의 열들 중 비어 있지 않은 첫 값 */
  const pick = (cells: string[], field: FieldKey) => {
    const m = maps.find((x) => x.field === field);
    if (!m) return "";
    for (const c of m.columns) {
      const v = clean(cells[c] ?? "");
      if (v) return v;
    }
    return "";
  };

  for (let i = index + 1; i < values.length; i++) {
    const cells = values[i] ?? [];
    const name = pick(cells, "name");
    const birthRaw = pick(cells, "birth");
    const phoneRaw = pick(cells, "phone");

    // 셋 다 비면 그냥 빈 줄 — 오류로 셀 것도 없다
    if (!name && !birthRaw && !phoneRaw) continue;

    if (!name) {
      skipped.push({ row: i + 1, reason: "이름 없음" });
      continue;
    }
    const birth = parseBirth8(expandBirth(birthRaw));
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

    const transport = pick(cells, "transport");
    const byBus = transport.includes("공동체 버스");
    rows.push({
      name,
      birth,
      phone,
      applicantType: pick(cells, "applicantType") || undefined,
      gender: readGender(pick(cells, "gender")),
      cellGroup: pick(cells, "cellGroup") || undefined,
      inviter: pick(cells, "inviter") || undefined,
      transport: transport || undefined,
      arriveDay: pick(cells, "arriveDay") || (byBus ? BUS.day : undefined),
      arriveTime: pick(cells, "arriveTime") || (byBus ? BUS.time : undefined),
      stay: pick(cells, "stay") || undefined,
      tshirt: pick(cells, "tshirt") || undefined,
    });
  }

  const col = (i: number) =>
    i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(64 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`;

  return {
    rows,
    headers: maps.map((m) => ({
      field: m.field,
      label: m.label,
      columns: m.columns.map((c) => `${col(c)} ${(header[c] ?? "").split("\n")[0].trim()}`),
    })),
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
