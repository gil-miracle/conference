"use client";

import { useState } from "react";
import { TIMETABLE } from "@/lib/content";

/** 금/토/주일 탭 전환 — 목업 v10 day-tabs 동작 */
export default function TimetableTabs() {
  const [active, setActive] = useState("1");

  return (
    <div className="reveal">
      <div className="day-tabs">
        {TIMETABLE.map((d) => (
          <button
            key={d.day}
            className={active === d.day ? "on" : ""}
            onClick={() => setActive(d.day)}
          >
            {d.label}
          </button>
        ))}
      </div>
      {TIMETABLE.map((d) => (
        <div
          key={d.day}
          className={`tt-list${active === d.day ? "" : " hidden"}`}
        >
          {d.items.map((item) => (
            <div key={item.time} className={`tt${item.main ? " main" : ""}`}>
              <time>{item.time}</time>
              <div>
                <b>{item.title}</b>
                <small>{item.sub}</small>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
