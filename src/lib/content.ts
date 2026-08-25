/**
 * 사이트 콘텐츠 — 강사·타임테이블·송리스트 등은 전부 이 파일만 고치면 된다.
 * (임시) 표시가 붙은 내용은 확정되면 교체할 것.
 */

export const EVENT = {
  title: "MIRACLE",
  subtitle: "2026 GIL Community Conference",
  /** 개회(첫 모임) 시각 — D-day 카운트다운 기준 */
  startsAt: "2026-09-11T16:00:00+09:00",
  dateLabel: "9.11 (금) — 13 (주일)",
  venue: "ACTS29 비전 빌리지",
  venueSub: "경기 용인시 처인구 양지면 ○○로 123 · 양지 온누리교회",
  /** 참가 신청 폼 (구글폼 등) — 확정되면 교체 */
  applyUrl: "#",
  naverMapUrl: "https://map.naver.com/p/search/ACTS29%20비전빌리지",
  kakaoMapUrl: "https://map.kakao.com/?q=ACTS29%20비전빌리지",
  /** 홍보 영상 YouTube ID — 나오면 채우기 (예: "dQw4w9WgXcQ") */
  youtubeId: null as string | null,
};

export const THEME_VERSE = {
  ref: "PSALM 135:6–7",
  refShort: "PSALM 135:6",
  text: "여호와께서는 하늘과 땅에서, 바다와 모든 깊은 곳에서 기뻐하시는 일이라면 무엇이든 하신다. 여호와께서는 땅끝에서 안개를 일으키고 비와 함께 번개를 보내시며 그 창고에서 바람을 내보내신다.",
  /** 말씀카드용 (볼드 구간 분리) */
  segments: [
    { t: "여호와께서는 하늘과 땅에서, 바다와 모든 깊은 곳에서 " },
    { t: "기뻐하시는 일이라면 무엇이든", b: true },
    { t: " 하신다." },
  ] as { t: string; b?: boolean }[],
};

export const ABOUT_LEDE =
  "하늘과 땅, 바다와 모든 깊은 곳에서 일하시는 하나님의 기적을 함께 목격하는 3일. (임시 소개 문구)";

export type Speaker = {
  /** URL slug — /speakers/[id] */
  id: string;
  name: string;
  org: string;
  tag: string;
  /** /public/speakers/ 아래 파일명 — 사진 확보 전엔 null */
  img: string | null;
  /** 상세 페이지 약력 (임시) */
  bio: string;
  /** 담당 세션 — 타임테이블과 연결 */
  sessions: { day: string; time: string; title: string }[];
};

export const SPEAKERS: Speaker[] = [
  {
    id: "kim-eunhye",
    name: "김은혜 목사",
    org: "OO교회",
    tag: "FRI · 저녁집회",
    img: null,
    bio: "(임시 약력) OO교회 담임. 다음세대 사역과 공동체 훈련에 힘써 왔으며, 이번 컨퍼런스에서 개회 예배를 인도합니다.",
    sessions: [{ day: "금 11", time: "19:30", title: "개회 예배 — CALL" }],
  },
  {
    id: "lee-mideum",
    name: "이믿음 목사",
    org: "△△교회",
    tag: "SAT · 오전집회",
    img: null,
    bio: "(임시 약력) △△교회 담임. 말씀 강해와 제자훈련 사역을 이어오고 있습니다.",
    sessions: [{ day: "토 12", time: "09:30", title: "오전 집회 — FAITH" }],
  },
  {
    id: "park-somang",
    name: "박소망 선교사",
    org: "□□선교회",
    tag: "SAT · 저녁집회",
    img: null,
    bio: "(임시 약력) □□선교회 파송 선교사. 현장에서 경험한 하나님의 기적을 나눕니다.",
    sessions: [{ day: "토 12", time: "19:30", title: "저녁 집회 — MIRACLE" }],
  },
  {
    id: "choi-sarang",
    name: "최사랑 목사",
    org: "GIL 공동체",
    tag: "SUN · 주일예배",
    img: null,
    bio: "(임시 약력) GIL 공동체를 섬기고 있습니다. 파송 예배로 3일을 마무리합니다.",
    sessions: [{ day: "주일 13", time: "10:30", title: "주일 예배 — SENT" }],
  },
];

export function getSpeaker(id: string) {
  return SPEAKERS.find((s) => s.id === id) ?? null;
}

export type TimetableItem = {
  time: string;
  title: string;
  sub: string;
  main?: boolean;
};

export const TIMETABLE: { day: string; label: string; items: TimetableItem[] }[] = [
  {
    day: "1",
    label: "금 11",
    items: [
      { time: "16:00", title: "도착 & 체크인", sub: "본관 로비 · 숙소 안내" },
      { time: "18:00", title: "저녁 식사", sub: "식당동" },
      { time: "19:30", title: "개회 예배 — CALL", sub: "김은혜 목사 · 대예배실", main: true },
      { time: "22:00", title: "조 모임", sub: "각 숙소" },
    ],
  },
  {
    day: "2",
    label: "토 12",
    items: [
      { time: "07:30", title: "아침 식사", sub: "식당동" },
      { time: "09:30", title: "오전 집회 — FAITH", sub: "이믿음 목사", main: true },
      { time: "14:00", title: "공동체 게임", sub: "야외 잔디마당 · 조별" },
      { time: "19:30", title: "저녁 집회 — MIRACLE", sub: "박소망 선교사", main: true },
    ],
  },
  {
    day: "3",
    label: "주일 13",
    items: [
      { time: "08:00", title: "아침 식사 & 퇴실 정리", sub: "숙소 점검" },
      { time: "10:30", title: "주일 예배 — SENT", sub: "최사랑 목사", main: true },
      { time: "12:30", title: "점심 & 파송", sub: "단체사진 촬영" },
    ],
  },
];

export type Song = {
  id: string;
  title: string;
  /** YouTube 영상 ID (URL 아님). 예: "dQw4w9WgXcQ" — 없으면 플레이어에 안내 표시 */
  youtubeId: string | null;
};

/** 집회 단위 세트 — 집회별 6~7곡 */
export type SongSet = {
  id: string;
  /** 집회명 (예: 개회 예배 — CALL) */
  name: string;
  /** 날짜 라벨 (예: 금 11) */
  dayLabel: string | null;
  /** 시각 라벨 (예: 19:30) */
  timeLabel: string | null;
  songs: Song[];
};

/**
 * Supabase 미설정(목업 모드) 폴백 겸 초기 시드.
 * 실서비스에서는 관리자 → 찬양 탭에서 관리한다.
 */
export const SONG_SETS_FALLBACK: SongSet[] = [
  {
    id: "set-1",
    name: "개회 예배 — CALL",
    dayLabel: "금 11",
    timeLabel: "19:30",
    songs: [
      { id: "s1-1", title: "은혜의 강가로 (임시)", youtubeId: null },
      { id: "s1-2", title: "주 품에 (임시)", youtubeId: null },
      { id: "s1-3", title: "여기에 모인 우리 (임시)", youtubeId: null },
      { id: "s1-4", title: "성령이 오셨네 (임시)", youtubeId: null },
      { id: "s1-5", title: "부르신 곳에서 (임시)", youtubeId: null },
      { id: "s1-6", title: "나의 반석 (임시)", youtubeId: null },
    ],
  },
  {
    id: "set-2",
    name: "오전 집회 — FAITH",
    dayLabel: "토 12",
    timeLabel: "09:30",
    songs: [
      { id: "s2-1", title: "믿음의 노래 (임시)", youtubeId: null },
      { id: "s2-2", title: "주 없이 살 수 없네 (임시)", youtubeId: null },
      { id: "s2-3", title: "약속하신 말씀 위에 (임시)", youtubeId: null },
      { id: "s2-4", title: "내 영혼이 (임시)", youtubeId: null },
      { id: "s2-5", title: "주만 바라볼지라 (임시)", youtubeId: null },
      { id: "s2-6", title: "선한 능력으로 (임시)", youtubeId: null },
    ],
  },
  {
    id: "set-3",
    name: "저녁 집회 — MIRACLE",
    dayLabel: "토 12",
    timeLabel: "19:30",
    songs: [
      { id: "s3-1", title: "기적을 노래해 (임시)", youtubeId: null },
      { id: "s3-2", title: "주가 일하시네 (임시)", youtubeId: null },
      { id: "s3-3", title: "일어나 빛을 발하라 (임시)", youtubeId: null },
      { id: "s3-4", title: "놀라운 은혜 (임시)", youtubeId: null },
      { id: "s3-5", title: "성령의 불 (임시)", youtubeId: null },
      { id: "s3-6", title: "우리의 하나님 (임시)", youtubeId: null },
      { id: "s3-7", title: "다시 오실 왕 (임시)", youtubeId: null },
    ],
  },
  {
    id: "set-4",
    name: "주일 예배 — SENT",
    dayLabel: "주일 13",
    timeLabel: "10:30",
    songs: [
      { id: "s4-1", title: "보내소서 (임시)", youtubeId: null },
      { id: "s4-2", title: "복의 근원 (임시)", youtubeId: null },
      { id: "s4-3", title: "이 땅에 (임시)", youtubeId: null },
      { id: "s4-4", title: "다시 만날 때까지 (임시)", youtubeId: null },
      { id: "s4-5", title: "가서 전하라 (임시)", youtubeId: null },
      { id: "s4-6", title: "축복하노라 (임시)", youtubeId: null },
    ],
  },
];

/** Supabase 미설정(목업 모드)일 때 보여줄 방명록 데모 */
export const GUESTBOOK_FALLBACK = [
  { id: "demo-1", display_name: "은혜", content: "벌써 기대돼요! 올해도 기적을 경험하길 바라요.", created_at: "2026-08-19T21:40:00+09:00", participant_id: null },
  { id: "demo-2", display_name: "요셉", content: "작년에 은혜 받고 올해 또 갑니다. 다들 만나요!", created_at: "2026-08-18T13:02:00+09:00", participant_id: null },
  { id: "demo-3", display_name: "한나", content: "송리스트 미리 듣고 있어요. 현장에서 같이 불러요.", created_at: "2026-08-17T09:15:00+09:00", participant_id: null },
];
