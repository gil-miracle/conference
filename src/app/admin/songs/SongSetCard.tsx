import type { SongSet } from "@/lib/content";
import { createSong } from "../actions/songs";
import SongItem from "./SongItem";
import DeleteSetButton from "./DeleteSetButton";

/** 집회 세트 하나 — 헤더 + 곡 목록 + 곡 추가 */
export default function SongSetCard({
  set,
  demo,
}: {
  set: SongSet;
  demo: boolean;
}) {
  const createSongForSet = createSong.bind(null, set.id);

  return (
    <div className="song-set">
      <div className="set-head">
        <div>
          <b>{set.name}</b>
          <small>
            {[set.dayLabel, set.timeLabel].filter(Boolean).join(" · ") || "TBD"}
            {` · ${set.songs.length} SONGS`}
          </small>
        </div>
        {!demo && <DeleteSetButton setId={set.id} name={set.name} />}
      </div>

      <ol className="set-songs">
        {set.songs.length === 0 && <li className="empty">아직 등록된 곡이 없어요.</li>}
        {set.songs.map((song, i) => (
          <SongItem key={song.id} song={song} index={i} demo={demo} />
        ))}
      </ol>

      {!demo && (
        <form className="inline-form" action={createSongForSet}>
          <input name="title" placeholder="곡 제목" required />
          <input name="song_key" placeholder="키" style={{ maxWidth: 64 }} />
          <input name="youtube" placeholder="YouTube 주소 또는 ID" style={{ minWidth: 150 }} />
          <button className="btn sm ghost">곡 추가</button>
        </form>
      )}
    </div>
  );
}
