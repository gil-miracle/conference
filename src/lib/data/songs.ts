import { getSupabaseAnon } from "@/lib/supabase/anon";
import { SONG_SETS_FALLBACK, type SongSet } from "@/lib/content";

type SongRow = {
  id: string;
  title: string;
  youtube_id: string | null;
  sort_order: number;
};

type SetRow = {
  id: string;
  name: string;
  day_label: string | null;
  time_label: string | null;
  leader: string | null;
  sort_order: number;
  songs: SongRow[] | null;
};

/**
 * 집회별 송리스트. Supabase 미설정이거나 데이터가 없으면
 * content.ts 폴백을 쓴다(목업 모드에서도 화면이 채워지도록).
 *
 * 공개 데이터라 쿠키 없는 클라이언트를 쓴다 — /songs를 정적으로 유지하려면
 * 이 경로에서 cookies()가 호출되면 안 된다.
 */
export async function getSongSets(): Promise<SongSet[]> {
  const supabase = getSupabaseAnon();
  if (!supabase) return SONG_SETS_FALLBACK;

  const { data, error } = await supabase
    .from("song_sets")
    .select("id,name,day_label,time_label,leader,sort_order,songs(id,title,youtube_id,sort_order)")
    .order("sort_order");

  if (error || !data || data.length === 0) return SONG_SETS_FALLBACK;

  return (data as SetRow[]).map((set) => ({
    id: set.id,
    name: set.name,
    dayLabel: set.day_label,
    timeLabel: set.time_label,
    leader: set.leader,
    songs: [...(set.songs ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((song) => ({
        id: song.id,
        title: song.title,
        youtubeId: song.youtube_id,
      })),
  }));
}
