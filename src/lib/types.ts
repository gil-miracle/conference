// ── 사이트 콘텐츠 (값은 lib/content.ts) ──────────────────────────

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

export type TimetableItem = {
  /** 시작 시각 또는 구간. 예: "21:00" / "07:00–09:00" */
  time: string;
  title: string;
  /** 부가 설명 — 없으면 줄을 만들지 않는다 */
  sub?: string;
  /** 주요 세션(MIRACLE 1~6) — 강조 블록으로 그리고 메인 요약에 노출된다 */
  main?: boolean;
  /** 왼쪽 강조 블록에 들어갈 세션 라벨. 예: "MIRACLE 1" */
  badge?: string;
  /** 설교자 — SPEAKERS의 id. 있으면 행 오른쪽에 사진이 붙는다 */
  speakerId?: string;
  /** 설교 제목 — 예배 순서에만 붙는다 */
  sermon?: string;
  /** 본문 말씀 출처. 설교자마다 다를 수 있어 순서별로 적는다 */
  verse?: string;
  /** 본문 말씀 전문 (우리말성경) — 절 번호와 함께 담는다 */
  verseText?: { n: number; text: string }[];
  /** 누르면 갈 곳. 설교자가 붙은 순서는 자동으로 설교자 상세로 간다 */
  href?: string;
};

/** 아침 QT — 하루에 하나 */
export type Qt = {
  /** 성경 범위. 예: "시편 42:1~5" */
  passage: string;
  /** 본문 전문 (우리말성경) */
  verses: { n: number; text: string }[];
  /** 묵상 질문 — 조별 나눔에 그대로 쓴다 */
  reflect: string[];
  /** 기도 */
  pray: string;
};

/** 하루치 일정 */
export type TimetableDay = {
  /** 탭 식별자 겸 DAY 번호 */
  day: string;
  /** 탭에 쓰는 짧은 라벨. 예: "금 11" */
  label: string;
  /** 헤더에 쓰는 날짜. 예: "9.11 (금)" */
  date: string;
  items: TimetableItem[];
  /** 그날 아침 QT — 없는 날(금요일)은 비워 둔다 */
  qt?: Qt;
};

export type Song = {
  id: string;
  title: string;
  /** YouTube 영상 ID (URL 아님). 예: "dQw4w9WgXcQ" — 없으면 플레이어에 안내 표시 */
  youtubeId: string | null;
};

export type SongSet = {
  id: string;
  /** 집회명 (예: 개회 예배 — CALL) */
  name: string;
  /** 날짜 라벨 (예: 금 11) */
  dayLabel: string | null;
  /** 시각 라벨 (예: 19:30) */
  timeLabel: string | null;
  songs: Song[];
  /** 찬양 인도자 */
  leader?: string | null;
};

// ── 참가자·운영 데이터 ───────────────────────────────────────────

export type ParticipantStatus = "pending" | "approved" | "rejected";

export type MySummary = {
  id: string;
  name: string;
  role: "member" | "admin";
  /** 가입 승인 상태 — approved가 아니면 숙소·조·QR은 내려오지 않는다 */
  status: ParticipantStatus;
  /** 숙소·조 배정이 공개된 상태인지 */
  rooms_open?: boolean;
  reject_reason: string | null;
  checked_in_at: string | null;
  checkin_token: string | null;
  room: {
    building: string;
    room_no: string;
    capacity: number;
    note: string | null;
  } | null;
  mates: string[];
  team: {
    name: string;
    leader: string | null;
    note: string | null;
  } | null;
};

export type GuestbookEntry = {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
  participant_id: string | null;
  hidden?: boolean;
};

export type Photo = {
  id: string;
  participant_id: string;
  cloudinary_public_id: string;
  width: number | null;
  height: number | null;
  hidden?: boolean;
  created_at: string;
};

export type AdminParticipant = {
  id: string;
  name: string;
  birth_date: string;
  phone: string;
  role: "member" | "admin";
  checked_in_at: string | null;
  auth_user_id: string | null;
  bound_at: string | null;
  bound_provider: string | null;
  room_id: string | null;
  team_id: string | null;
  rooms: { building: string; room_no: string } | null;
  teams: { name: string } | null;
};

export type AdminRoom = {
  id: string;
  building: string;
  room_no: string;
  capacity: number;
};

export type AdminTeam = { id: string; name: string; leader: string | null };

/** 배정 화면용 최소 참가자 정보 */
export type PersonLite = {
  id: string;
  name: string;
  room_id: string | null;
  team_id: string | null;
};

/** 관리자 승인 대기 목록 한 건 (사칭 판별용 소셜 프로필 포함) */
export type JoinRequest = {
  id: string;
  name: string;
  birth_date: string;
  phone: string;
  status: ParticipantStatus;
  requested_at: string | null;
  bound_provider: string | null;
  /** 관리자가 미리 올린 명단에 있던 사람인지 */
  matched: boolean;
  social_name: string | null;
  social_full_name: string | null;
  social_avatar: string | null;
  social_picture: string | null;
  social_email: string | null;
};

export type AdminStats = {
  total: number;
  checked_in: number;
  /** 승인 대기 건수 */
  pending: number;
  rooms_total: number;
  rooms_used: number;
  guestbook: number;
  photos: number;
  recent: { name: string; checked_in_at: string; room: string | null }[];
  missing: { name: string; phone: string; room: string | null }[];
};

export type BannerSetting = { text: string; visible: boolean };

/** 사이트 메뉴 노출 — 관리자 설정에서 항목별로 켜고 끈다 */
export type MenuKey = "about" | "speakers" | "timetable" | "songs" | "guestbook" | "gallery";
export type MenuVisibility = Record<MenuKey, boolean>;
