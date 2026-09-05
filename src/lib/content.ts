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
  /* 첫 화면. 없으면 아이폰이 검은 판을 보여준다 */
  teaserPoster: "/teaser-poster.jpg",
  /* 오시는 길 아래 홍보 영상. public에 파일을 넣으면 나타나고, 없으면 그
     자리만 빠진다. 둘 다 없으면 제목까지 통째로 사라진다.
     label을 적으면 영상 아래 이름이 붙는다 — 두 편이 뭐가 다른지 알려 준다 */
  promoVideos: [
    { src: "/promo.mp4", poster: "/promo-poster.jpg" },
    { src: "/promo-2.mp4", poster: "/promo-2-poster.jpg" },
  ] as { src: string; poster?: string; label?: string }[],
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
  // 문장마다 줄을 나눈다 — 한 문장씩 읽히는 문구라 중간에서 접히면 힘이 빠진다
  "기적의 자리에 오신 여러분을 환영합니다.\n" +
  "당신의 삶에 시작될 가장 위대한 기적을 꿈꾸십시오.";

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
        sermon: "생명",
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
    qt: {
      passage: "시편 119:169~176",
      theme: "주님의 계명을 잊지 않는 삶",
      verses: [
        {
          n: 169,
          text:
            "오 여호와여, 내 부르짖음이 주 앞에 닿게 하소서. " +
            "주의 약속대로 내게 깨달음을 주소서.",
        },
        {
          n: 170,
          text:
            "내가 간절히 구하는 소리가 주 앞에 미치게 하소서. " +
            "주의 약속대로 나를 건져 주소서.",
        },
        {
          n: 171,
          text: "주께서 주의 율례로 나를 가르치실 때 내 입술에 찬양을 담게 하소서.",
        },
        {
          n: 172,
          text: "내 혀가 주의 말씀을 노래하게 하소서. 주의 모든 계명이 의롭기 때문입니다.",
        },
        {
          n: 173,
          text: "내가 주의 교훈을 선택했으니 주의 손이 나를 돕게 하소서.",
        },
        {
          n: 174,
          text: "오 여호와여, 내가 주의 구원을 사모하니 주의 법은 내 기쁨이 됐습니다.",
        },
        {
          n: 175,
          text: "내 영혼이 살아 주를 찬양하게 하시고 주의 법이 나를 붙들게 하소서.",
        },
        {
          n: 176,
          text:
            "내가 잃어버린 양처럼 길을 잃었으니 주의 종을 찾으소서. " +
            "내가 주의 계명을 잊지 않았으니 말입니다.",
        },
      ],
      reflect: [
        "119편 마지막 단락에서 시편 기자는 무엇을 간구했나요? 나의 간구와 찬양에는 하나님 말씀에 대한 애정이 얼마나 담겨 있나요?",
        "시편 기자는 어떤 상황에서 자신이 하나님의 계명을 잊지 않았다고 했나요? 내 삶을 말씀으로 채우기 위해 지금부터 무엇을 시작하면 좋을까요?",
      ],
      pray:
        "하나님, 저를 찾으시고 깨우치시며 살리시는 하나님 말씀을 온 힘 다해 사모하길 원합니다. " +
        "믿음과 삶이 메말라 있을지라도 말씀 앞에 나아가 하나님의 약속을 되뇌게 하소서. " +
        "말씀을 귀히 여기는 자에게 임하시는 하나님 능력의 손을 경험하게 하소서.",
    },
    items: [
      { time: "07:00–08:30", title: "QT 및 아침식사", href: "/qt/2" },
      { time: "08:30–09:00", title: "예배당 입장" },
      {
        time: "09:00–10:30",
        badge: "MIRACLE 2",
        speakerId: "cho-youngchan",
        // 이 시간은 성경 통독이다 — 눌러 본문을 볼 수 있게 한다
        href: "/reading",
        title: "오전 예배",
        // ⚠️ 설교 제목·본문은 예시다. 확정되면 교체할 것.
        sermon: "말씀",
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
      {
        time: "10:30–12:30",
        title: "멘토의 TMI",
        sub: "Too Meaningful Information",
        href: "/mentoring",
      },
      { time: "12:30–14:00", title: "점심식사" },
      { time: "14:00–16:00", title: "리그 오브 미라클" },
      {
        time: "16:00–18:00",
        badge: "MIRACLE 3",
        speakerId: "lee-giljae",
        role: "강사",
        title: "선교 특강",
        sermon: "교회",
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
        sermon: "제자",
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
    qt: {
      passage: "역대상 1:1~3:24",
      theme: "신실하신 하나님을 상기시키는 족보",
      verses: [
        { n: "1:1", text: "아담, 셋, 에노스," },
        { n: "1:27", text: "아브람, 곧 아브라함," },
        {
          n: "1:34",
          text: "아브라함은 이삭을 낳았습니다. 이삭의 아들은 에서와 이스라엘입니다.",
        },
        {
          n: "2:1",
          text:
            "이스라엘의 아들은 르우벤, 시므온, 레위, 유다, 잇사갈, 스불론, " +
            "단, 요셉, 베냐민, 납달리, 갓, 아셀입니다.",
        },
        {
          n: "2:4",
          text:
            "유다의 며느리 다말과 유다 사이에 베레스와 세라가 태어났습니다. " +
            "유다는 모두 다섯 아들이 있었습니다.",
        },
        { n: "2:15", text: "여섯째 오셈, 일곱째 다윗입니다." },
        {
          n: "3:17",
          text: "사로잡혀 간 여고냐의 자손들은 그 아들 스알디엘,",
        },
        {
          n: "3:19",
          text:
            "브다야의 아들은 스룹바벨과 시므이입니다. " +
            "스룹바벨의 아들은 므술람과 하나냐입니다. 슬로밋은 그들의 누이입니다.",
        },
      ],
      note:
        "세 장에 걸친 족보라 여기에는 아담에서 아브라함으로, 유다에서 다윗으로, " +
        "다시 포로기 이후로 이어지는 줄기만 담았습니다. 전문은 성경을 펴서 읽어 주세요.",
      reflect: [
        "역대기 기자는 왜 이스마엘과 에서의 족보, 그리고 에돔 왕들의 족보를 먼저 기록했을까요? 나는 세상 속에서 어떤 정체성을 가지고 살아가나요?",
        "포로기와 귀환 이후까지 이어지는 다윗 족보는 무엇을 말해 주나요? 나의 실패에도 불구하고 하나님이 신실하게 이루어 가시는 일은 무엇인가요?",
      ],
      pray:
        "만성적으로 의약품이 부족한 북한에서 마약이 만병통치약처럼 오용돼 주민들의 삶이 더 피폐해지고 있습니다. " +
        "이들을 고통에서 건지시고 생명 길로 인도해 주시길 기도합시다. " +
        "인구 절반 이상이 빈곤에 허덕이는 온두라스는 살인율이 매우 높은 국가입니다. " +
        "범죄 조직에 노출되기 쉬운 온두라스 아이들에게 주님의 긍휼과 보호가 임하길 기도합시다.",
    },
    items: [
      { time: "07:00–08:30", title: "QT 및 아침식사", href: "/qt/3" },
      { time: "08:30–10:00", title: "혜화로 이동" },
      { time: "10:00–12:00", title: "방구석 미라클 1열" },
      { time: "12:00–13:30", title: "점심식사" },
      { time: "13:30–14:00", title: "예배당 입장" },
      {
        time: "14:00–16:00",
        badge: "MIRACLE 5",
        speakerId: "bae-haengsam",
        title: "주일 예배",
        sermon: "사명",
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
