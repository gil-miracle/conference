import type { Speaker } from "@/lib/content";

export default function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="spk">
      <div className="ph">
        {speaker.img ? (
          <img src={`/speakers/${speaker.img}`} alt={speaker.name} />
        ) : (
          <div className="ph-fallback">PHOTO</div>
        )}
      </div>
      <div className="in">
        <b>{speaker.name}</b>
        <small>{speaker.org}</small>
        <span className="tag">{speaker.tag}</span>
      </div>
    </div>
  );
}
