import SessionRow from "./SessionRow";
import type { TimetableItem } from "@/lib/content";

/**
 * 주요 순서 블록 — 왼쪽 라벨 한 칸이 여러 행에 걸친다.
 *
 * 한 예배가 특순·설교처럼 두 순서로 나뉘어도 MIRACLE 배지는 하나여야 한다.
 * 행마다 배지를 그리면 같은 세션이 둘로 보이고, 배지 글자도 행마다 가운데
 * 정렬돼 블록 전체의 가운데와 어긋난다. 그래서 배지를 블록이 갖고,
 * 행은 본문과 사진만 갖는다.
 */
export default function SessionBlock({ items }: { items: TimetableItem[] }) {
  const badge = items.find((i) => i.badge)?.badge;
  const badgeNo = badge?.match(/\d+$/)?.[0];
  /* 행이 암시적으로 생기는 그리드에서는 `1 / -1`이 마지막 줄을 못 찾는다.
     (-1은 명시된 그리드의 끝을 가리키는데 여기엔 명시된 행이 없다)
     그래서 걸칠 행 수를 직접 센다. */
  const span = { gridRow: `1 / span ${items.length}` };

  return (
    <div className="ss-block">
      {badge ? (
        <div className="ss-badge" data-n={badgeNo} style={span}>
          {/* MIRACLE / 1 을 두 줄로 — 숫자가 크게 읽히도록 */}
          <span className="w">{badge.replace(/\s*\d+$/, "")}</span>
          <span className="n">{badgeNo}</span>
        </div>
      ) : (
        /* MIRACLE이 아닌 주요 순서 — 배지 자리에 시각을 세운다.
           곁순서 행과 같은 자리라 표를 세로로 가르는 기준선이 끊기지 않는다 */
        <time className="ss-time" style={span}>
          {items[0].time}
        </time>
      )}
      {items.map((item) => (
        <SessionRow
          key={`${item.time}-${item.title}`}
          item={item}
          /* 왼쪽 칸이 이미 시각을 보여주는 블록에서는 본문에 또 적지 않는다 */
          inlineTime={Boolean(badge)}
        />
      ))}
    </div>
  );
}
