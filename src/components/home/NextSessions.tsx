import { TIMETABLE } from "@/lib/content";

/** 메인 요약용 — 주요 집회(main)만 뽑아 3일 흐름을 한눈에 */
export default function NextSessions() {
  const highlights = TIMETABLE.flatMap((day) =>
    day.items
      .filter((item) => item.main)
      .map((item) => ({ ...item, dayLabel: day.label }))
  );

  return (
    <div className="tt-list reveal">
      {highlights.map((item) => (
        <div className="tt main" key={`${item.dayLabel}-${item.time}`}>
          <time>
            {item.dayLabel}
            <br />
            {item.time}
          </time>
          <div>
            <b>{item.title}</b>
            <small>{item.sub}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
