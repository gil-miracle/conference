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
  Qt,
  Song,
  SongSet,
} from "./types";

export type { Speaker, TimetableItem, TimetableDay, Qt, Song, SongSet };

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
  /** 참가 신청 구글폼. "#"이면 화면에서 신청 링크가 알아서 빠진다 */
  applyUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeJdM2WUQrBDzL9e2iwtqsdFRFML0oGkLTd68mQvFkBS82wmQ/viewform",
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

// 설교자·강사 6인. 사진은 public/speakers/ 아래 파일명으로 연결된다.
// 일정 순서대로 나열한다 (금 → 토 → 주일).
// 어느 순서를 맡는지는 TIMETABLE의 speakerId 한 곳에서만 관리한다.
// ⚠️ bio는 형식을 보여주기 위한 예시다. 본인 확인을 거쳐 실제 약력으로 교체할 것.
export const SPEAKERS: Speaker[] = [
  {
    id: "choi-jaeyoon",
    name: "최재윤 목사",
    org: "온누리교회 GIL 청년부",
    tag: "FRI · MIRACLE 1",
    img: "choi-jaeyoon.png",
    bio:
      "(예시) 온누리교회 GIL 청년부에서 청년들과 함께하고 있습니다. 이번 컨퍼런스에서는 첫 저녁 예배를 맡아, 사흘의 문을 여는 자리에 섭니다.",
  },
  {
    id: "cho-youngchan",
    name: "조영찬 전도사",
    org: "온누리교회 GIL 청년부",
    tag: "SAT · MIRACLE 2",
    img: "cho-youngchan.png",
    bio:
      "(예시) 온누리교회 GIL 청년부에서 청년들과 함께 예배하며 말씀을 나누고 있습니다. 이번 컨퍼런스에서는 둘째 날 아침을 여는 예배를 맡습니다.",
  },
  {
    id: "lee-giljae",
    name: "이길재 선교사",
    org: "The Story 대표",
    tag: "SAT · 선교 특강",
    img: "lee-giljae.png",
    bio:
      "(예시) The Story 대표로 선교 현장을 섬기고 있습니다. 이번 컨퍼런스에서는 토요일 오후 선교 특강을 맡아, 흩어져 살아갈 자리를 함께 그립니다.",
  },
  {
    id: "kim-dongwook",
    name: "김동욱 목사",
    org: "히즈윌",
    tag: "SAT · SPECIAL GUEST",
    img: "kim-dongwook.png",
    bio:
      "(예시) 둘째 날 저녁 예배의 특순을 맡습니다. 말씀 앞에 마음을 여는 자리를 찬양으로 준비합니다.",
  },
  {
    id: "jeon-hyeok",
    name: "전혁 목사",
    org: "사송영락교회 담임목사 · 예람워십 대표",
    tag: "SAT · MIRACLE 4",
    img: "jeon-hyeok.png",
    bio:
      "(예시) 이번 컨퍼런스에서는 둘째 날 저녁 예배를 맡습니다. 사흘 가운데 가장 깊이 들어가는 자리입니다.",
  },
  {
    id: "bae-haengsam",
    name: "배행삼 목사",
    org: "온누리교회 부목사 · 2000선교본부",
    tag: "SUN · MIRACLE 5",
    img: "bae-haengsam.png",
    bio:
      "(예시) 이번 컨퍼런스에서는 마지막 주일 예배를 맡아, 흩어지는 자리를 함께합니다.",
  },
];

export function getSpeaker(id: string) {
  return SPEAKERS.find((s) => s.id === id) ?? null;
}

/** QT가 있는 날 (금요일은 저녁 시작이라 없다) */
export function getQtDays() {
  return TIMETABLE.filter((d) => d.qt);
}

/** 날짜 id로 QT 찾기 */
export function getQtDay(day: string) {
  return TIMETABLE.find((d) => d.day === day && d.qt) ?? null;
}

/**
 * 그 사람이 맡은 일정 — 어느 날, 어떤 순서인지.
 * 상세 화면에서 "그 사람이 있는 날짜 탭"으로 보내는 데 쓴다.
 * 배정은 TIMETABLE의 speakerId 하나로만 관리한다(두 곳에 적지 않는다).
 */
export function getSpeakerSession(speakerId: string) {
  for (const day of TIMETABLE) {
    const item = day.items.find((i) => i.speakerId === speakerId);
    if (item) return { day, item };
  }
  return null;
}

export const TIMETABLE: TimetableDay[] = [
  {
    day: "1",
    label: "9.11 (금)",
    date: "9.11 (금)",
    items: [
      {
        time: "20:00–21:00",
        title: "등록",
        sub: "본관 B1층 박모세홀 · 체크인 · 티셔츠 수령",
      },
      {
        time: "21:00–23:00",
        badge: "MIRACLE 1",
        speakerId: "choi-jaeyoon",
        title: "저녁 예배",
        sermon: "성령의 불을 받으십시오",
        verse: "사도행전 2:3–4",
        verseText: [
          {
            n: 3,
            text: "그리고 불꽃같이 갈라지는 혀들이 나타나 그들 각 사람 위에 내려앉았습니다.",
          },
          {
            n: 4,
            text:
              "그러자 그들은 모두 성령으로 충만해져서 성령께서 말하게 하시는 대로 " +
              "다른 언어들로 말하기 시작했습니다.",
          },
        ],
        main: true,
      },
    ],
  },
  {
    day: "2",
    label: "9.12 (토)",
    date: "9.12 (토)",
    // ⚠️ QT 본문·묵상·기도는 형식을 보여주기 위한 예시다. 확정본으로 교체할 것.
    qt: {
      passage: "시편 42:1~2",
      verses: [
        {
          n: 1,
          text: "하나님이여, 사슴이 시냇물을 찾아 헐떡이듯 내 영혼이 주를 찾아 헐떡입니다.",
        },
        {
          n: 2,
          text:
            "내 영혼이 하나님, 곧 살아 계신 하나님을 갈망합니다. " +
            "내가 언제 나아가 하나님의 얼굴을 뵐 수 있을까요?",
        },
      ],
      reflect: [
        "지난 한 해 내 영혼이 가장 목말랐던 순간은 언제였나요?",
        "무엇으로 그 목마름을 채우려 해 왔나요?",
        "오늘 이곳에서 하나님께 구하고 싶은 한 가지는 무엇인가요?",
      ],
      pray:
        "주님, 제 영혼이 주를 찾게 하소서. 다른 것으로 채우려 했던 자리를 " +
        "오늘 주님으로 채워 주소서.",
    },
    items: [
      { time: "07:00–08:30", title: "QT 및 아침식사", href: "/qt/2" },
      { time: "08:30–09:00", title: "예배당 입장" },
      {
        time: "09:00–10:30",
        badge: "MIRACLE 2",
        speakerId: "cho-youngchan",
        title: "오전 예배",
        // ⚠️ 설교 제목·본문은 예시다. 확정되면 교체할 것.
        sermon: "내가 새 일을 행하리라",
        verse: "이사야 43:19",
        verseText: [
          {
            n: 19,
            text:
              "보라, 내가 새 일을 행할 것이니 이제 그것이 나타날 것이다. " +
              "너희가 그것을 알지 못하겠느냐? 내가 광야에 길을 내고 사막에 강을 낼 것이다.",
          },
        ],
        main: true,
      },
      // 눌러서 신청 화면으로 — 이 순서만 미리 정해두는 것이 있다
      { time: "10:30–12:30", title: "멘토님 타임", href: "/mentoring" },
      { time: "12:30–14:00", title: "점심식사" },
      { time: "14:00–16:00", title: "프로그램" },
      {
        time: "16:00–18:00",
        badge: "MIRACLE 3",
        speakerId: "lee-giljae",
        role: "강사",
        title: "선교 특강",
        main: true,
      },
      { time: "18:00–19:30", title: "저녁식사" },
      { time: "19:30–20:00", title: "예배당 입장" },
      {
        // 저녁 예배의 앞순서 — 아래 저녁 예배와 MIRACLE 4 배지를 함께 쓴다
        time: "20:00–20:30",
        speakerId: "kim-dongwook",
        role: "찬양",
        title: "SPECIAL GUEST",
        main: true,
      },
      {
        time: "20:30–23:00",
        badge: "MIRACLE 4",
        joinPrev: true,
        speakerId: "jeon-hyeok",
        title: "저녁 예배",
        sermon: "깊은 곳까지 물이 이르러",
        verse: "에스겔 47:5",
        verseText: [
          {
            n: 5,
            text:
              "그가 또 1,000규빗을 재었는데 내가 건널 수 없는 강이 됐습니다. " +
              "물이 불어나 헤엄쳐야 할 만큼 깊어져서 건너갈 수 없는 강이 된 것입니다.",
          },
        ],
        main: true,
      },
    ],
  },
  {
    day: "3",
    label: "9.13 (주일)",
    date: "9.13 (주일)",
    // ⚠️ QT 본문·묵상·기도는 형식을 보여주기 위한 예시다. 확정본으로 교체할 것.
    qt: {
      passage: "시편 121:1~2",
      verses: [
        {
          n: 1,
          text: "내가 산들을 향해 눈을 들리라. 내 도움이 어디서 올까?",
        },
        {
          n: 2,
          text: "내 도움은 하늘과 땅을 만드신 여호와께로부터 옵니다.",
        },
      ],
      reflect: [
        "이 사흘 동안 하나님이 나에게 하신 말씀은 무엇인가요?",
        "돌아가서 가장 먼저 바꾸고 싶은 것 하나는 무엇인가요?",
        "그 자리에서 나를 도우실 분이 누구인지 다시 새겨 봅시다.",
      ],
      pray:
        "주님, 여기서 받은 것을 돌아가는 자리에서도 붙들게 하소서. " +
        "제 힘이 아니라 주님의 도우심으로 걷게 하소서.",
    },
    items: [
      { time: "07:00–08:30", title: "QT 및 아침식사", href: "/qt/3" },
      { time: "08:30–10:00", title: "혜화로 이동" },
      { time: "10:00–12:00", title: "영화 관람" },
      { time: "12:00–13:30", title: "점심식사" },
      { time: "13:30–14:00", title: "예배당 입장" },
      {
        time: "14:00–16:00",
        badge: "MIRACLE 5",
        speakerId: "bae-haengsam",
        title: "주일 예배",
        sermon: "일어나 빛을 발하라",
        verse: "이사야 60:1",
        verseText: [
          {
            n: 1,
            text: "일어나 빛을 발하여라. 네 빛이 왔고 여호와의 영광이 네 위에 떠올랐다.",
          },
        ],
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
    name: "MIRACLE 5 — 주일 예배",
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
