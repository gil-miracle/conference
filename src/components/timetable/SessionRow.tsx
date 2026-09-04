import Link from "next/link";
import SpeakerPhoto from "@/components/SpeakerPhoto";
import { getSpeaker, type TimetableItem } from "@/lib/content";

/**
 * 일정 한 줄.
 *
 * 시간은 제목 위에 작게 올린다. 왼쪽에 시간 칸을 따로 세우면 어느 줄이든
 * 그 폭을 내줘야 해서, 정작 읽어야 할 제목이 좁은 칸으로 밀린다.
 *
 * 집회 줄은 누를 수 없다. 제목·말씀 여는 사람·소속까지 표에 다 나와 있어
 * 들어가서 더 알 것이 없다 — 눌리는 것처럼 보이기만 하면 오히려 헷갈린다.
 */
export default function SessionRow({
  item,
  showTime = true,
}: {
  item: TimetableItem;
  /** 묶음 머리에 이미 시간이 적혀 있으면 줄에서는 뺀다 */
  showTime?: boolean;
}) {
  if (!item.main) {
    const plain = (
      <div className="ss-body">
        {showTime && <time className="ss-time">{item.time}</time>}
        <b>{item.title}</b>
        {item.sub && <small>{item.sub}</small>}
      </div>
    );
    // href가 붙은 순서(QT·멘토링 등)는 곁순서라도 눌러서 들어갈 수 있다
    return item.href ? (
      <Link className="ss-row linked" href={item.href}>
        {plain}
      </Link>
    ) : (
      <div className="ss-row">{plain}</div>
    );
  }

  const speaker = item.speakerId ? getSpeaker(item.speakerId) : null;
  const role = item.role ?? "설교";

  return (
    <div className={`ss-row main${speaker ? " has-speaker" : ""}`}>
      <div className="ss-main-body">
        {showTime && <time className="ss-time">{item.time}</time>}
        {/* 설교 제목이 있으면 그게 본문이다 — 순서명(저녁 예배)은
            묶음 머리에 이미 드러나 한 줄을 더 쓸 이유가 없다 */}
        <b className={item.sermon ? "sermon" : undefined}>
          {item.sermon ?? item.title}
        </b>
        {speaker ? (
          /* 본문 말씀은 빼고 누가 여는지만 남긴다. 소속은 이름 아래 줄에,
             이름 첫 글자에 맞춰 선다 */
          <small className="preacher">
            <span className="role">{role}</span>
            <span className="who">
              {speaker.name}
              {speaker.org && (
                /* '사송영락교회 담임목사 · 예람워십 대표'처럼 소속이 둘일 때,
                   그냥 흘리면 '대표'만 떨어져 내려간다. 가운뎃점에서만 나뉘게
                   조각을 묶어 둔다 — 한 소속은 통째로 붙어 다닌다 */
                <span className="org">
                  {speaker.org.split("·").map((part, i) => (
                    <span key={part}>
                      {i > 0 && <span className="dot"> · </span>}
                      <span className="one">{part.trim()}</span>
                    </span>
                  ))}
                </span>
              )}
            </span>
          </small>
        ) : (
          item.sub && <small>{item.sub}</small>
        )}
      </div>
      {speaker && (
        <span className="ss-speaker">
          <SpeakerPhoto speaker={speaker} />
        </span>
      )}
    </div>
  );
}
