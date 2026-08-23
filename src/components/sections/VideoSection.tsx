import SectionHead from "@/components/SectionHead";
import VideoPlayer from "@/components/VideoPlayer";
import { EVENT } from "@/lib/content";

export default function VideoSection() {
  return (
    <section id="video">
      <div className="container">
        <SectionHead title="홍보 영상" idx="06 — VIDEO" />
        <VideoPlayer youtubeId={EVENT.youtubeId} />
      </div>
    </section>
  );
}
