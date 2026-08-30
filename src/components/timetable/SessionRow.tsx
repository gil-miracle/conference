import Link from "next/link";
import SpeakerPhoto from "@/components/SpeakerPhoto";
import { getSpeaker, type TimetableItem } from "@/lib/content";

/**
 * 일정 한 줄.
 *
 * 시간은 제목 위에 작게 올린다. 왼쪽에 시간 칸을 따로 세우면 어느 줄이든
 * 그 폭을 내줘야 해서, 정작 읽어야 할 제목이 좁은 칸으로 밀린다.
 *
 * 설교자가 연결된 세션은 **행 전체**가 그 사람의 소개로 가는 링크다.
 * 사진만 누르게 두면 표적이 작고, 사진이 없는 설교자는 누를 곳이 없어진다.
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

  const inner = (
    <>
      <div className="ss-main-body">
        {showTime && <time className="ss-time">{item.time}</time>}
        {/* 설교 제목이 있으면 그게 본문이다 — 순서명(저녁 예배)은
            묶음 머리에 이미 드러나 한 줄을 더 쓸 이유가 없다 */}
        <b className={item.sermon ? "sermon" : undefined}>
          {item.sermon ?? item.title}
        </b>
        {speaker ? (
          <>
            {/* 본문 말씀이 먼저, 사람이 그다음 — 무엇을 여느냐가 누가 여느냐보다 앞선다 */}
            {item.verse && (
              <small className="preacher">
                <span className="role">말씀</span>
                {item.verse}
              </small>
            )}
            <small className="preacher">
              <span className="role">{role}</span>
              {speaker.name}
            </small>
          </>
        ) : (
          item.sub && <small>{item.sub}</small>
        )}
      </div>
      {speaker && (
        <span className="ss-speaker">
          <SpeakerPhoto speaker={speaker} />
        </span>
      )}
    </>
  );

  const className = `ss-row main${speaker ? " has-speaker" : ""}`;

  if (!speaker) return <div className={className}>{inner}</div>;

  return (
    <Link
      className={`${className} linked`}
      href={`/speakers/${speaker.id}`}
      aria-label={`${item.sermon ?? item.title} — ${speaker.name} 소개`}
    >
      {inner}
    </Link>
  );
}
