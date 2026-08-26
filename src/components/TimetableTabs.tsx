"use client";

import { useState } from "react";
import DaySchedule from "@/components/timetable/DaySchedule";
import { TIMETABLE } from "@/lib/content";

/** 금/토/주일 탭 전환 — 고른 하루만 DAY 블록으로 보여준다 */
export default function TimetableTabs() {
  const [active, setActive] = useState(TIMETABLE[0]?.day ?? "1");
  const day = TIMETABLE.find((d) => d.day === active) ?? TIMETABLE[0];

  return (
    <div className="reveal">
      <div className="day-tabs">
        {TIMETABLE.map((d) => (
          <button
            key={d.day}
            className={active === d.day ? "on" : ""}
            aria-pressed={active === d.day}
            onClick={() => setActive(d.day)}
          >
            {d.label}
          </button>
        ))}
      </div>
      {day && <DaySchedule day={day} />}
    </div>
  );
}
