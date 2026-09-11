import Link from "next/link";
import SpeakerPhoto from "@/components/SpeakerPhoto";
import { getSpeaker, type TimetableItem } from "@/lib/content";

/**
 * 일정 한 줄.
 *
 * 시간은 제목 위에 작게 올린다. 왼쪽에 시간 칸을 따로 세우면 어느 줄이든
 * 그 폭을 내줘야 해서, 정작 읽어야 할 제목이 좁은 칸으로 밀린다.
 *
 * 예배 줄은 주제어 → 제목 → 본문 출처 → 설교자 순으로 쌓인다.
 *
 * 집회 줄은 본문 말씀이 있을 때만 눌린다 — 들어가면 본문 전문이 있다.
 * 찬양 특순처럼 표에 다 나와 있는 줄은 눌리지 않는다 — 눌리는 것처럼
 * 보이기만 하면 오히려 헷갈린다.
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

  const body = (
    <>
      <div className="ss-main-body">
        {showTime && <time className="ss-time">{item.time}</time>}
        {/* 주제어(생명·교회…)가 줄의 머리다 — 상징과 함께 제목 위에 선다 */}
        {item.sermon && (
          <span className="theme">
            {item.sermon}
            {item.emoji && ` ${item.emoji}`}
          </span>
        )}
        {/* 설교 제목이 있으면 그게 본문이다. 제목이 아직 없는 예배는
            순서명(오전 예배)으로 버틴다 */}
        <b className={item.sermonTitle ? "sermon" : undefined}>
          {item.sermonTitle ?? item.title}
        </b>
        {/* 한문 제목의 독음 — 제목 바로 아래 한 단계 작게 */}
        {item.sermonTitle && item.sermonTitleReading && (
          <small className="reading">{item.sermonTitleReading}</small>
        )}
        {/* 본문 출처 — 설교자 줄과 같은 두 칸 격자라 라벨 폭이 맞는다 */}
        {item.sermonTitle && item.verse && (
          <small className="preacher">
            <span className="role">본문</span>
            <span className="who">{item.verse}</span>
          </small>
        )}
        {speaker ? (
          /* 본문 말씀은 빼고 누가 여는지만 남긴다. 소속은 이름과 한 줄로
             흐르다가, 자리가 모자라면 통째로 다음 줄로 내려간다 */
          <small className="preacher">
            <span className="role">{role}</span>
            <span className="who">
              {/* 이름은 쪼개지지 않는다. 세로줄을 붙여 두어 줄이 나뉘어도
                  다음 줄 맨 앞에 홀로 남지 않는다 */}
              <span className="one">
                {speaker.name}
                {speaker.org && " |"}
              </span>{" "}
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
    </>
  );

  /* 갈 곳이 있는 집회만 눌린다. href가 따로 있으면(성경 통독) 그리로,
     본문 말씀이 실린 예배면 설교자 상세로 — 제목과 본문을 거기서 읽는다.
     사진만 누르게 두면 표적이 작아, 행 전체를 링크로 삼는다 */
  const href =
    item.href ?? (speaker && item.verseText ? `/speakers/${speaker.id}` : null);
  const className = `ss-row main${speaker ? " has-speaker" : ""}`;
  return href ? (
    <Link
      className={`${className} linked`}
      href={href}
      aria-label={
        speaker && !item.href
          ? `${item.sermon ?? item.title} — ${speaker.name} 설교 본문`
          : undefined
      }
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
