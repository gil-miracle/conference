/**
 * 사이트 콘텐츠 — 강사·타임테이블·송리스트 등은 전부 이 파일만 고치면 된다.
 * (임시) 표시가 붙은 내용은 확정되면 교체할 것.
 *
 * 타입 선언은 lib/types.ts에 모여 있다 (이 파일은 값만 둔다).
 * 기존 import 경로가 깨지지 않도록 여기서 그대로 재수출한다.
 */
import type {
  Speaker,
  TimetableItem,
  TimetableDay,
  Song,
  SongSet,
} from "./types";

export type { Speaker, TimetableItem, TimetableDay, Song, SongSet };

export const EVENT = {
  title: "MIRACLE",
  subtitle: "2026 GIL Community Conference",
  /** 첫 예배(MIRACLE 1) 시각 — D-day 카운트다운 기준 */
  startsAt: "2026-09-11T21:00:00+09:00",
  /** 파송 후 해산 시각 — 이 시각을 지나면 히어로가 인사말로 바뀐다 */
  endsAt: "2026-09-13T18:00:00+09:00",
  /** 포스터 표기와 맞춘다 — 9월11일(금)~13일(주일) */
  dateLabel: "9월 11일(금) ~ 13일(주일)",
  venue: "ACTS29 비전 빌리지",
  venueSub: "경기 용인시 처인구 양지읍 추계로 62 · 양지 온누리교회",
  address: "경기 용인시 처인구 양지읍 추계로 62",
  /** 지도 좌표 — 카카오맵 마커 위치 */
  lat: 37.2278,
  lng: 127.2903,
  /** 참가 신청 폼 (구글폼 등) — 확정되면 교체 */
  applyUrl: "#",
  naverMapUrl: "https://map.naver.com/p/search/Acts29%20비전빌리지",
  kakaoMapUrl: "https://map.kakao.com/?q=Acts29%20비전빌리지",
  /** 홍보 영상 YouTube ID — 나오면 채우기 (예: "dQw4w9WgXcQ") */
  youtubeId: null as string | null,
  /**
   * 메인에 넣는 홍보 영상 파일. public/ 아래에 두고 경로를 적는다.
   * 파일이 없으면 화면에서 알아서 빠지므로 미리 적어둬도 안전하다.
   */
  teaserVideo: "/teaser.mp4",
};

export const THEME_VERSE = {
  ref: "시편 135:6–7",
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

// 설교자 3인. 사진은 public/speakers/ 아래 파일명으로 연결된다.
// 예배 순서대로 나열한다 (MIRACLE 1 → 4 → 6).
// ⚠️ bio(약력)는 아직 확인 전이라 비워 뒀다 — 채우면 상세 페이지에 나온다.
export const SPEAKERS: Speaker[] = [
  {
    id: "cho-youngchan",
    name: "조영찬 전도사",
    org: "온누리교회 GIL 청년부",
    tag: "FRI · MIRACLE 1",
    img: "cho-youngchan.jpg",
    bio: "",
    sessions: [
      { day: "금 11", time: "21:00–23:00", title: "MIRACLE 1 — 저녁 예배" },
    ],
  },
  {
    id: "lee-jaehoon",
    name: "이재훈 목사",
    org: "온누리교회 위임목사",
    tag: "SAT · MIRACLE 4",
    img: "lee-jaehoon.jpg",
    bio: "",
    sessions: [
      { day: "토 12", time: "20:00–23:00", title: "MIRACLE 4 — 저녁 예배" },
    ],
  },
  {
    id: "choi-jaeyoon",
    name: "최재윤 목사",
    org: "온누리교회 GIL 청년부",
    tag: "SUN · MIRACLE 6",
    img: "choi-jaeyoon.jpg",
    bio: "",
    sessions: [
      { day: "주일 13", time: "14:00–16:00", title: "MIRACLE 6 — 주일 예배" },
    ],
  },
];

export function getSpeaker(id: string) {
  return SPEAKERS.find((s) => s.id === id) ?? null;
}

export const TIMETABLE: TimetableDay[] = [
  {
    day: "1",
    label: "9.11 (금)",
    date: "9.11 (금)",
    items: [
      { time: "20:00–21:00", title: "등록", sub: "본관 로비 · 숙소 안내" },
      {
        time: "21:00–23:00",
        badge: "MIRACLE 1",
        speakerId: "cho-youngchan",
        title: "저녁 예배",
        sermon: "성령의 ‘불’을 받으십시오",
        main: true,
      },
    ],
  },
  {
    day: "2",
    label: "9.12 (토)",
    date: "9.12 (토)",
    items: [
      { time: "07:00–09:00", title: "QT 및 아침식사" },
      {
        time: "09:00–12:00",
        badge: "MIRACLE 2",
        title: "프로그램 or 예배",
        main: true,
      },
      { time: "12:00–14:00", title: "점심식사" },
      { time: "14:00–16:00", badge: "MIRACLE 3", title: "프로그램", main: true },
      { time: "18:00–20:00", title: "저녁식사" },
      {
        time: "20:00–23:00",
        badge: "MIRACLE 4",
        speakerId: "lee-jaehoon",
        title: "저녁 예배",
        sermon: "‘물’이 바다 덮음같이",
        main: true,
      },
    ],
  },
  {
    day: "3",
    label: "9.13 (주일)",
    date: "9.13 (주일)",
    items: [
      { time: "07:00–09:00", title: "QT 및 아침식사" },
      { time: "09:00–10:00", title: "출발" },
      { time: "10:00–12:00", badge: "MIRACLE 5", title: "프로그램", main: true },
      { time: "12:00–14:00", title: "점심식사" },
      {
        time: "14:00–16:00",
        badge: "MIRACLE 6",
        speakerId: "choi-jaeyoon",
        title: "주일 예배",
        sermon: "어둠 속에서 더 밝게 빛나는 ‘빛’",
        main: true,
      },
    ],
  },
];

/** 집회 단위 세트 — 집회별 6~7곡 */
/**
 * Supabase 미설정(목업 모드) 폴백 겸 초기 시드.
 * 실서비스에서는 관리자 → 찬양 탭에서 관리한다.
 */
export const SONG_SETS_FALLBACK: SongSet[] = [
  {
    id: "set-1",
    name: "MIRACLE 1 — 저녁 예배",
    dayLabel: "금 11",
    timeLabel: "21:00",
    leader: "조영찬 전도사",
    songs: [],
  },
  {
    id: "set-4",
    name: "MIRACLE 4 — 저녁 예배",
    dayLabel: "토 12",
    timeLabel: "20:00",
    leader: "최재윤 목사",
    songs: [],
  },
  {
    id: "set-6",
    name: "MIRACLE 6 — 주일 예배",
    dayLabel: "주일 13",
    timeLabel: "14:00",
    leader: "박민희 자매",
    songs: [],
  },
];

/** Supabase 미설정(목업 모드)일 때 보여줄 방명록 데모 */
export const GUESTBOOK_FALLBACK = [
  { id: "demo-1", display_name: "은혜", content: "벌써 기대돼요! 올해도 기적을 경험하길 바라요.", created_at: "2026-08-19T21:40:00+09:00", participant_id: null },
  { id: "demo-2", display_name: "요셉", content: "작년에 은혜 받고 올해 또 갑니다. 다들 만나요!", created_at: "2026-08-18T13:02:00+09:00", participant_id: null },
  { id: "demo-3", display_name: "한나", content: "송리스트 미리 듣고 있어요. 현장에서 같이 불러요.", created_at: "2026-08-17T09:15:00+09:00", participant_id: null },
];
