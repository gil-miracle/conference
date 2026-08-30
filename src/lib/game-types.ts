export type Game = {
  id: string;
  name: string;
  host_id: string | null;
  note: string | null;
  sort_order: number;
};

export type GameScore = { game_id: string; team_id: string; points: number };

export type Bonus = {
  id: string;
  team_id: string;
  points: number;
  reason: string;
  created_at: string;
};

/** team_standings() RPC가 돌려주는 한 줄 */
export type Standing = {
  id: string;
  name: string;
  game_total: number;
  bonus_total: number;
  total: number;
};
