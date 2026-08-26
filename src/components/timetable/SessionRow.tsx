import Link from "next/link";
import SpeakerPhoto from "@/components/SpeakerPhoto";
import { getSpeaker, type TimetableItem } from "@/lib/content";

/**
 * 일정 한 줄.
 *
 * 주요 세션(MIRACLE 1~6)은 왼쪽에 세션 라벨 블록이 붙고, 나머지 순서는
 * 시각 + 제목만 있는 담백한 줄로 남는다 — 하루를 훑을 때 "예배가 언제인지"가
 * 먼저 눈에 들어오게 하려는 것.
 *
 * 설교자가 연결된 세션은 **행 전체**가 그 사람의 소개로 가는 링크다.
 * 사진만 누르게 두면 표적이 작고, 사진이 없는 설교자는 누를 곳이 없어진다.
 */
export default function SessionRow({ item }: { item: TimetableItem }) {
  if (!item.main) {
    const plain = (
      <>
        <time className="ss-time">{item.time}</time>
        <div className="ss-body">
          <b>{item.title}</b>
          {item.sub && <small>{item.sub}</small>}
        </div>
      </>
    );
    // href가 붙은 순서(QT 등)는 곁순서라도 눌러서 들어갈 수 있다
    return item.href ? (
      <Link className="ss-row linked" href={item.href}>
        {plain}
      </Link>
    ) : (
      <div className="ss-row">{plain}</div>
    );
  }

  const speaker = item.speakerId ? getSpeaker(item.speakerId) : null;
  const badgeNo = item.badge?.match(/\d+$/)?.[0];

  const inner = (
    <>
      {item.badge && (
        <div className="ss-badge" data-n={badgeNo}>
          {/* MIRACLE / 1 을 두 줄로 — 숫자가 크게 읽히도록 */}
          <span className="w">{item.badge.replace(/\s*\d+$/, "")}</span>
          <span className="n">{badgeNo}</span>
        </div>
      )}
      <div className="ss-main-body">
        <time className="ss-time">{item.time}</time>
        {/* 설교 제목이 있으면 그게 본문이다 — 순서명(저녁 예배)은
            왼쪽 배지와 시각으로 이미 드러나 한 줄을 더 쓸 이유가 없다 */}
        <b className={item.sermon ? "sermon" : undefined}>
          {item.sermon ?? item.title}
        </b>
        {speaker ? (
          <>
            {/* 본문 말씀이 먼저, 설교자가 그다음 — 무엇을 여느냐가 누가 여느냐보다 앞선다 */}
            {item.verse && (
              <small className="preacher">
                <span className="role">말씀</span>
                {item.verse}
              </small>
            )}
            <small className="preacher">
              <span className="role">설교</span>
              {speaker.name}
              {speaker.org && (
                <>
                  <span className="sep">|</span>
                  <span className="org">{speaker.org}</span>
                </>
              )}
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

  const className = `ss-row main${item.badge ? "" : " no-badge"}${
    speaker ? " has-speaker" : ""
  }`;

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
