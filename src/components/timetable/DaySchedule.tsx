import type { TimetableDay } from "@/lib/content";
import SessionRow from "./SessionRow";

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
        {day.items.map((item) => (
          <SessionRow key={`${item.time}-${item.title}`} item={item} />
        ))}
      </div>
    </section>
  );
}
