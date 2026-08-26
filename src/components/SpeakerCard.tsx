import type { Speaker } from "@/lib/content";
import SpeakerPhoto from "./SpeakerPhoto";

export default function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="spk">
      <div className="ph">
        <SpeakerPhoto speaker={speaker} />
      </div>
      <div className="in">
        <b>{speaker.name}</b>
        {/* 소속·태그는 확정 전이면 비어 있다 — 빈 줄을 만들지 않는다 */}
        {speaker.org && <small>{speaker.org}</small>}
        {speaker.tag && <span className="tag">{speaker.tag}</span>}
      </div>
    </div>
  );
}
