export type MySummary = {
  id: string;
  name: string;
  role: "member" | "admin";
  checked_in_at: string | null;
  checkin_token: string;
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

export type AdminStats = {
  total: number;
  checked_in: number;
  rooms_total: number;
  rooms_used: number;
  guestbook: number;
  photos: number;
  recent: { name: string; checked_in_at: string; room: string | null }[];
  missing: { name: string; phone: string; room: string | null }[];
};

export type BannerSetting = { text: string; visible: boolean };
