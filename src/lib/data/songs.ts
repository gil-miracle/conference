import { getSupabaseServer } from "@/lib/supabase/server";
import { SONG_SETS_FALLBACK, type SongSet } from "@/lib/content";

type SongRow = {
  id: string;
  title: string;
  song_key: string | null;
  youtube_id: string | null;
  sort_order: number;
};

type SetRow = {
  id: string;
  name: string;
  day_label: string | null;
  time_label: string | null;
  sort_order: number;
  songs: SongRow[] | null;
};

/**
 * 집회별 송리스트. Supabase 미설정이거나 데이터가 없으면
 * content.ts 폴백을 쓴다(목업 모드에서도 화면이 채워지도록).
 */
export async function getSongSets(): Promise<SongSet[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return SONG_SETS_FALLBACK;

  const { data, error } = await supabase
    .from("song_sets")
    .select("id,name,day_label,time_label,sort_order,songs(id,title,song_key,youtube_id,sort_order)")
    .order("sort_order");

  if (error || !data || data.length === 0) return SONG_SETS_FALLBACK;

  return (data as SetRow[]).map((set) => ({
    id: set.id,
    name: set.name,
    dayLabel: set.day_label,
    timeLabel: set.time_label,
    songs: [...(set.songs ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((song) => ({
        id: song.id,
        title: song.title,
        songKey: song.song_key,
        youtubeId: song.youtube_id,
      })),
  }));
}
