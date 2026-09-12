"use client";

import { useEffect, useState } from "react";
import DaySchedule from "./DaySchedule";
import type { TimetableDay } from "@/lib/content";
import { DAYS } from "@/lib/gallery-days";

/** 오늘이 행사 며칠째인가 — 행사 밖이면 null. 화면은 정적이라 서버는 오늘을 모른다 */
function todayId(days: readonly TimetableDay[]): string | null {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const i = (DAYS as readonly string[]).indexOf(today);
  return i >= 0 ? (days[i]?.day ?? null) : null;
}

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
 *
 * 메뉴에서 들어오면(첫 날 주소) 오늘 탭으로 옮긴다. 화면은 정적이라 서버가
 * 오늘을 모르니 마운트 뒤에 한다 — 첫 그림은 첫 날이고 곧 오늘로 바뀐다.
 * 날짜를 짚어 들어온 주소(/timetable/3)는 그대로 둔다 — 그 날을 보려고 온
 * 것이다 (2026-09-12 결정).
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

  useEffect(() => {
    // 첫 날 주소로 들어왔을 때만 — 메뉴·탭바가 보내는 주소가 그것이다
    if (initial !== days[0]?.day) return;
    const today = todayId(days);
    if (today && today !== initial) go(today);
    // 처음 한 번만 — 그 뒤 탭 이동은 사람이 한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
