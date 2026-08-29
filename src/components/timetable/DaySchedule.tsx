import type { TimetableDay, TimetableItem } from "@/lib/content";
import SessionBlock from "./SessionBlock";
import SessionRow from "./SessionRow";

/**
 * 연달아 붙는 주요 순서를 한 블록으로 묶는다.
 * joinPrev가 붙은 순서는 앞 순서와 같은 세션이라는 뜻 — 배지를 나눠 갖지 않는다.
 */
function groupItems(items: readonly TimetableItem[]): TimetableItem[][] {
  return items.reduce<TimetableItem[][]>((groups, item) => {
    const last = groups[groups.length - 1];
    if (item.joinPrev && item.main && last?.[last.length - 1]?.main) last.push(item);
    else groups.push([item]);
    return groups;
  }, []);
}

/**
 * 하루치 일정 — 날짜 + DAY 대형 타이틀 + 순서 목록.
 * 메인 요약과 전체 일정 페이지가 같은 블록을 쓴다.
 */
export default function DaySchedule({ day }: { day: TimetableDay }) {
  return (
    <section className="day-block">
      <header className="day-head">
        <span className="date">{day.date}</span>
        <h3 className="day-no">DAY {day.day}</h3>
      </header>
      <div className="ss-list">
        {groupItems(day.items).map((group) => {
          const key = `${group[0].time}-${group[0].title}`;
          return group[0].main ? (
            <SessionBlock key={key} items={group} />
          ) : (
            <SessionRow key={key} item={group[0]} />
          );
        })}
      </div>
    </section>
  );
}
