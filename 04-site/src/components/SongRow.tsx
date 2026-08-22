import type { Song } from "@/lib/content";
import { PlayIcon } from "@/components/icons";

export default function SongRow({ song, index }: { song: Song; index: number }) {
  return (
    <div className="song">
      <span className="no">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <b>{song.title}</b>
        <small>{song.sub}</small>
      </div>
      <span className="key">{song.key}</span>
      <a
        className="yt"
        href={song.youtube ?? "#"}
        target={song.youtube ? "_blank" : undefined}
        rel="noreferrer"
        aria-label="듣기"
      >
        <PlayIcon />
      </a>
    </div>
  );
}
