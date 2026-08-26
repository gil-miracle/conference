"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import DaySchedule from "@/components/timetable/DaySchedule";
import { TIMETABLE } from "@/lib/content";

/**
 * 금/토/주일 탭 전환.
 * `?day=2`로 특정 날짜를 열 수 있다 — 설교자 상세에서 그 사람이 있는 날로 돌아온다.
 */
export default function TimetableTabs() {
  const params = useSearchParams();
  const fromQuery = TIMETABLE.find((d) => d.day === params.get("day"))?.day;

  // 정적 페이지라 첫 렌더에는 쿼리가 비어 있고 하이드레이션 뒤에 채워진다.
  // useState(초깃값)로 잡으면 그 갱신을 놓치므로, 사용자가 탭을 누르기 전까지는
  // 쿼리를 그대로 따라가고 누른 뒤에만 선택을 고정한다.
  const [picked, setPicked] = useState<string | null>(null);
  const active = picked ?? fromQuery ?? TIMETABLE[0]?.day ?? "1";
  const day = TIMETABLE.find((d) => d.day === active) ?? TIMETABLE[0];

  return (
    <div className="reveal">
      <div className="day-tabs">
        {TIMETABLE.map((d) => (
          <button
            key={d.day}
            className={active === d.day ? "on" : ""}
            aria-pressed={active === d.day}
            onClick={() => setPicked(d.day)}
          >
            {d.label}
          </button>
        ))}
      </div>
      {day && <DaySchedule day={day} />}
    </div>
  );
}
