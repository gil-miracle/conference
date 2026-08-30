import SessionRow from "./SessionRow";
import type { TimetableItem } from "@/lib/content";

/** "20:00–20:30" + "20:30–23:00" → "20:00–23:00" */
function spanOf(items: TimetableItem[]) {
  const parts = (t: string) => t.split(/[–-]/).map((s) => s.trim());
  const first = parts(items[0].time)[0];
  const last = parts(items[items.length - 1].time)[1] ?? "";
  return last ? `${first}–${last}` : first;
}

/**
 * 한 집회 묶음.
 *
 * MIRACLE은 가로 한 줄로 이름과 시간을 얹고, 그 아래 순서들이 쌓인다.
 * 왼쪽에는 같은 색 선이 묶음 전체를 따라 내려간다 — "이 집회가 여기서
 * 여기까지"가 선 길이로 읽힌다.
 *
 * 예전에는 왼쪽에 세로 배지 한 칸을 세웠는데, 그 칸이 표 절반 가까이를
 * 쓰면서 정작 제목이 밀렸다. 색은 선으로 줄이고 자리는 본문에 준다.
 */
export default function SessionBlock({ items }: { items: TimetableItem[] }) {
  const badge = items.find((i) => i.badge)?.badge;
  const badgeNo = badge?.match(/\d+$/)?.[0];

  return (
    <div className="ss-group" data-n={badgeNo}>
      {badge && (
        <div className="ss-gh">
          <span className="w">{badge}</span>
          <time>{spanOf(items)}</time>
        </div>
      )}
      {items.map((item) => (
        <SessionRow
          key={`${item.time}-${item.title}`}
          item={item}
          showTime={!badge}
        />
      ))}
    </div>
  );
}
