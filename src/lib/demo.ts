import type {
  AdminParticipant,
  AdminRoom,
  AdminStats,
  MySummary,
  PersonLite,
  RoomHold,
} from "./types";

/**
 * 미리보기(데모) 모드 — Supabase 미설정 상태에서 로그인 후 화면과 관리자 화면을
 * 보여주기 위한 가짜 데이터. 목업 v10 / 관리자 목업과 같은 내용.
 * env가 설정되면 어디서도 쓰이지 않는다.
 */

export const DEMO_COOKIE = "miracle_demo";

// ── 참가자(My) ──────────────────────────────────────────────────

export const DEMO_SUMMARY: MySummary = {
  id: "demo",
  name: "김예찬",
  role: "member",
  status: "approved",
  reject_reason: null,
  checked_in_at: null,
  checkin_token: "00000000-0000-4000-8000-000000000000",
  room: { building: "비전관", room_no: "203", capacity: 4, note: "본관에서 도보 2분 · 4인실" },
  mates: ["김예찬", "박다윗", "이요셉", "정사무엘"],
  team: {
    name: "오렌지조",
    leader: "이요셉",
    note: "토 14:00 잔디마당 집합",
  },
};

// ── 관리자 ──────────────────────────────────────────────────────

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** 대시보드 통계 (관리자 목업 수치) — recent 시각은 호출 시점 기준 */
export function demoAdminStats(): AdminStats {
  return {
    total: 120,
    checked_in: 87,
    pending: 3,
    rooms_total: 30,
    rooms_used: 28,
    guestbook: 142,
    photos: 0,
    recent: [
      { name: "박다윗", checked_in_at: minsAgo(2), room: "비전관 203" },
      { name: "정사무엘", checked_in_at: minsAgo(3), room: "비전관 203" },
      { name: "김한나", checked_in_at: minsAgo(6), room: "은혜관 102" },
      { name: "이레베카", checked_in_at: minsAgo(9), room: "은혜관 102" },
    ],
    missing: [
      { name: "강바울", phone: "010-8888-9012", room: null },
      { name: "이요셉", phone: "010-2222-1234", room: "비전관 203" },
      { name: "최마리아", phone: "010-7777-5678", room: "은혜관 103" },
    ],
  };
}

const p = (
  id: string,
  name: string,
  birth: string,
  phone: string,
  opts: Partial<AdminParticipant> = {}
): AdminParticipant => ({
  id,
  name,
  birth_date: birth,
  phone,
  role: "member",
  checked_in_at: null,
  auth_user_id: null,
  bound_at: null,
  bound_provider: null,
  room_id: null,
  team_id: null,
  rooms: null,
  teams: null,
  source: "sheet",
  applicant_type: null,
  gender: null,
  cell_group: null,
  inviter: null,
  transport: null,
  arrive_day: null,
  arrive_time: null,
  stay: null,
  tshirt: null,
  ...opts,
});

/** 체크인 탭 명단 */
export function demoAdminParticipants(): AdminParticipant[] {
  return [
    p("d1", "강바울", "1998-02-17", "010-8888-9012", {
      applicant_type: "길 공동체 지체",
      gender: "남",
      cell_group: "BEGIN",
      transport: "공동체 버스",
      arrive_day: "9월 11일(금)",
      arrive_time: "오후 7시 30분",
      stay: "9월 11일(금), 9월 12일(토)",
      tshirt: "L",
    }),
    p("d2", "김예찬", "1994-01-01", "010-1234-3456", {
      role: "admin",
      checked_in_at: minsAgo(32),
      auth_user_id: "demo-auth",
      bound_provider: "kakao",
      room_id: "r1",
      team_id: "t1",
      rooms: { building: "비전관", room_no: "203", leader_id: "d4" },
      teams: { name: "오렌지조" },
      applicant_type: "길 공동체 지체",
      gender: "남",
      cell_group: "BASIC",
      transport: "자차",
      arrive_day: "9월 11일(금)",
      stay: "9월 11일(금), 9월 12일(토)",
      tshirt: "XL",
    }),
    p("d3", "박다윗", "1996-07-11", "010-3333-7890", {
      applicant_type: "길 공동체 지체",
      gender: "남",
      cell_group: "CORNERSTONE",
      transport: "대중교통(이천역 경강선으로 본부가 픽업할 예정)",
      arrive_day: "9월 11일(금)",
      stay: "9월 12일(토)",
      tshirt: "L",
      checked_in_at: minsAgo(2),
      room_id: "r1",
      team_id: "t2",
      rooms: { building: "비전관", room_no: "203", leader_id: "d4" },
      teams: { name: "그린조" },
    }),
    p("d4", "이요셉", "1992-03-02", "010-2222-1234", {
      bound_provider: "google",
      applicant_type: "초청 받은 지체",
      gender: "남",
      inviter: "김예찬",
      transport: "자차",
      arrive_day: "9월 12일(토)",
      stay: "9월 12일(토)",
      tshirt: "M",
      room_id: "r1",
      team_id: "t1",
      rooms: { building: "비전관", room_no: "203", leader_id: "d4" },
      teams: { name: "오렌지조" },
    }),
    p("d5", "최마리아", "1995-12-25", "010-7777-5678", {
      gender: "여",
      rooms: { building: "은혜관", room_no: "103", leader_id: null },
    }),
    p("d11", "이한별", "1985-04-09", "010-4545-1212", {
      source: "manual",
      applicant_type: "교역자",
      gender: "남",
      stay: "9월 11일(금), 9월 12일(토)",
      tshirt: "XL",
    }),
  ];
}

/** 숙소·조 탭 데이터 */
export const DEMO_ROOMS: AdminRoom[] = [
  { id: "r1", building: "비전관", room_no: "203", capacity: 4, gender: "남", leader_id: "d4" },
  { id: "r2", building: "은혜관", room_no: "102", capacity: 4, gender: "여", leader_id: null },
  { id: "r3", building: "은혜관", room_no: "103", capacity: 4, gender: "기타", leader_id: null },
];

export const DEMO_HOLDS: RoomHold[] = [
  { id: "h1", room_id: "r3", name: "이한별 목사", gender: "남" },
];

export const DEMO_TEAMS = [
  { id: "t1", name: "오렌지조", leader: "이요셉" },
  { id: "t2", name: "그린조", leader: "김한나" },
];

/** 배정 화면용 사람 한 줄 — 다락방·초청자 판단에 필요한 값까지만 */
const pl = (
  id: string,
  name: string,
  room_id: string | null,
  team_id: string | null,
  cell_group: string | null = null,
  inviter: string | null = null,
  applicant_type: string | null = null,
  gender: string | null = null
): PersonLite => ({
  id,
  name,
  room_id,
  team_id,
  cell_group,
  inviter,
  applicant_type,
  gender,
});

export const DEMO_PEOPLE: PersonLite[] = [
  pl("d2", "김예찬", "r1", "t1", "BASIC", null, null, "남"),
  pl("d4", "이요셉", "r1", "t1", null, "김예찬", null, "남"),
  pl("d3", "박다윗", "r1", "t2", "CORNERSTONE", null, null, "남"),
  pl("d6", "정사무엘", "r1", "t2", "BASIC", null, null, "남"),
  pl("d7", "김한나", "r2", "t2", "BEGIN", null, null, "여"),
  pl("d8", "이레베카", "r2", "t1", "BEGIN", null, null, "여"),
  pl("d9", "윤에스더", "r2", null, "CORNERSTONE", null, null, "여"),
  pl("d5", "최마리아", "r3", "t1", null, "박다윗", null, "여"),
  pl("d1", "강바울", null, null, "BEGIN", null, null, "남"),
  pl("d10", "한느헤미야", null, null, null, null, "교역자", "여"),
];

/** 게시판 탭 방명록 */
export function demoBoardGuestbook() {
  return [
    {
      id: "g0",
      display_name: "익명",
      content: "(부적절한 내용 예시 — 숨김 처리된 글)",
      hidden: true,
      created_at: minsAgo(60),
    },
    {
      id: "g1",
      display_name: "은혜",
      content: "벌써 기대돼요! 올해도 기적을 경험하길 바라요.",
      hidden: false,
      created_at: minsAgo(60 * 26),
    },
    {
      id: "g2",
      display_name: "요셉",
      content: "작년에 은혜 받고 올해 또 갑니다. 다들 만나요!",
      hidden: false,
      created_at: minsAgo(60 * 55),
    },
  ];
}

// ── /my 미리보기 (비로그인) ──────────────────────────────────────

/**
 * 로그인 전 방문자에게 보여주는 My 화면 미리보기.
 * "로그인하면 무엇이 보이는지"를 알려주는 용도라 전부 가짜 데이터다.
 *
 * 실제 참가자 이름을 쓰지 않고, checkin_token도 null로 둔다 —
 * 미리보기에서 스캔 가능한 QR을 만들면 체크인 데스크에서 혼선이 생긴다.
 */
export const MY_PREVIEW: MySummary = {
  id: "preview",
  name: "홍길동",
  role: "member",
  status: "approved",
  rooms_open: true,
  reject_reason: null,
  checked_in_at: null,
  checkin_token: null,
  room: {
    building: "비전관",
    room_no: "203",
    capacity: 4,
    note: "본관에서 도보 2분 · 4인실",
  },
  mates: ["강믿음", "박소망", "이사랑", "홍길동"],
  team: { name: "오렌지조", leader: "이사랑", note: "토 14:00 잔디마당 집합" },
};
