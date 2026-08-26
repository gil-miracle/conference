import DaySchedule from "@/components/timetable/DaySchedule";
import { TIMETABLE } from "@/lib/content";

/**
 * 메인 요약 — 3일을 DAY 블록으로 한 번에 보여준다.
 * 전체 일정 페이지와 같은 블록을 쓰므로 두 화면의 모양이 어긋나지 않는다.
 */
export default function NextSessions() {
  return (
    <div className="reveal">
      {TIMETABLE.map((day) => (
        <DaySchedule key={day.day} day={day} />
      ))}
    </div>
  );
}
