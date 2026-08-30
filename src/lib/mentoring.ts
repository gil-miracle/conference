/** 멘토링 세션 한 줄 — mentor_board() RPC가 돌려주는 모양 */
export type MentorSession = {
  id: string;
  mentor_name: string;
  title: string;
  place: string | null;
  starts_at: string;
  capacity: number;
  opens_at: string;
  closes_at: string;
  sort_order: number;
  /** 지금 몇 명이 신청했나 — 명단은 내려주지 않고 숫자만 */
  taken: number;
};

export type MentorBoard = {
  /** 내가 고른 세션 id, 없으면 null */
  mine: string | null;
  sessions: MentorSession[];
};

/** 관리자 화면이 보는 세션 (신청자 명단이 붙는다) */
export type AdminMentorSession = MentorSession & {
  mentor_id: string | null;
};
