"use client";

import { useState } from "react";
import DaySchedule from "./DaySchedule";
import type { TimetableDay } from "@/lib/content";

/**
 * 날짜 탭.
 *
 * 세 날을 모두 그려 두고 보일 것만 남긴다. 탭을 눌러도 화면을 새로 받지
 * 않으니 제목이 사라졌다 다시 뜨지 않는다 — 링크로 옮겨 다니면 화면이
 * 통째로 다시 그려져서, 볼 때마다 「일정표」가 새로 나타났다.
 *
 * 세 날을 다 그리는 것은 감춘 값이 아니라 **정적 렌더링에 실리는 값**이다.
 * 물음표 뒤(?day=)나 클라이언트 상태로만 고르면 HTML에 하나도 안 실려,
 * 행사장에서 제일 많이 여는 화면이 껍데기부터 받는다.
 *
 * 주소는 갈아 끼운다. 카톡으로 「토요일 일정」을 그대로 나눌 수 있어야 해서
 * /timetable/2 같은 주소는 살아 있어야 한다. 다만 기록을 쌓지는 않는다 —
 * 탭을 여섯 번 누르고 뒤로 가기를 여섯 번 하게 만들 이유가 없다.
 */
export default function DayTabs({
  days,
  initial,
}: {
  days: readonly TimetableDay[];
  initial: string;
}) {
  const [day, setDay] = useState(initial);

  const go = (next: string) => {
    setDay(next);
    window.history.replaceState(null, "", `/timetable/${next}`);
  };

  return (
    <>
      <div className="day-tabs">
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={d.day === day ? "on" : ""}
            aria-current={d.day === day ? "page" : undefined}
            onClick={() => go(d.day)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {days.map((d) => (
        <div key={d.day} hidden={d.day !== day}>
          <DaySchedule day={d} />
        </div>
      ))}
    </>
  );
}
