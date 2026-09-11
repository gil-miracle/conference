import SpeakerPhoto from "@/components/SpeakerPhoto";
import type { Speaker, TimetableItem } from "@/lib/types";

/**
 * 말씀 화면 머리 — 사진, 태그, 이름, 소속.
 *
 * 설교자 상세와 성경 통독이 같은 머리를 쓴다. 태그 뒤에는 그 시간의
 * 주제어가 'SAT · MIRACLE 2 · 말씀 📖' 처럼 같은 글씨로 이어진다 —
 * 따로 굵히거나 키우지 않는다. 한 줄 안에서 층이 생기면 눈이 멈춘다.
 */
export default function SpeakerHead({
  speaker,
  item,
}: {
  speaker: Speaker;
  /** 그 사람이 맡은 순서 — 주제어와 상징을 여기서 꺼낸다 */
  item?: TimetableItem | null;
}) {
  const theme = item?.sermon
    ? ` · ${item.sermon}${item.emoji ? ` ${item.emoji}` : ""}`
    : "";
  return (
    <div className="spk-detail reveal">
      <div className="ph">
        <SpeakerPhoto speaker={speaker} />
      </div>
      <div className="meta">
        {speaker.tag && (
          <span className="tag">
            {speaker.tag}
            {theme}
          </span>
        )}
        <h2>{speaker.name}</h2>
        {speaker.org && <p className="org">{speaker.org}</p>}
      </div>
    </div>
  );
}
