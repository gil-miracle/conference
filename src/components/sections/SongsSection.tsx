import SectionHead from "@/components/SectionHead";
import SongRow from "@/components/SongRow";
import { SONGS } from "@/lib/content";

export default function SongsSection() {
  return (
    <section id="songs">
      <div className="container">
        <SectionHead title="송리스트" idx="04 — SETLIST" />
        <p className="lede reveal" style={{ marginBottom: 32 }}>
          미리 듣고 오면 현장에서 더 깊이 예배할 수 있어요.
        </p>
        <div className="reveal">
          {SONGS.map((song, i) => (
            <SongRow key={song.title} song={song} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
