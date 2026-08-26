"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/content";

/** 한국 날짜(YYYY-MM-DD) — 서버·기기 시간대와 무관하게 행사 기준으로 센다 */
const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const kstDay = (t: number) => Date.parse(`${KST_DATE.format(new Date(t))}T00:00:00Z`);

type Strip = { big: string; label: string; clock: string };

const INITIAL: Strip = {
  big: "D-··",
  label: "UNTIL MIRACLE CONFERENCE",
  clock: "--:--:--",
};

/**
 * 히어로 아래 띠 — 행사 진행 상태에 따라 세 모습으로 바뀐다.
 *
 *   행사 전  D-16 · UNTIL MIRACLE CONFERENCE · 21:02:30
 *   행사 중  DAY 2 · NOW — MIRACLE CONFERENCE
 *   행사 후  THANK YOU · 2026 MIRACLE CONFERENCE
 *
 * 행사 3일 동안 참가자가 메인을 가장 많이 열어보므로, 그때 화면이
 * `D-DAY 00:00:00`으로 멈춰 있지 않고 "오늘이 며칠째"를 알려주게 했다.
 *
 * D-N은 시간 차가 아니라 **한국 날짜 기준 달력 일수**로 센다.
 * `남은시간/24`로 계산하면 9.10 밤 10시(23시간 남음)에 벌써 D-DAY가 떠버린다.
 */
export default function HeroDday() {
  const [strip, setStrip] = useState<Strip>(INITIAL);

  useEffect(() => {
    const start = new Date(EVENT.startsAt).getTime();
    const end = new Date(EVENT.endsAt).getTime();
    const startDay = kstDay(start);
    const pad = (n: number) => String(n).padStart(2, "0");

    const tick = () => {
      const now = Date.now();

      if (now >= end) {
        setStrip({
          big: "THANK YOU",
          label: `${new Date(EVENT.startsAt).getFullYear()} MIRACLE CONFERENCE`,
          clock: "",
        });
        return;
      }

      if (now >= start) {
        // 행사 중 — 며칠째인지 (첫날이 DAY 1)
        const nth = Math.round((kstDay(now) - startDay) / 864e5) + 1;
        setStrip({
          big: `DAY ${nth}`,
          label: "NOW — MIRACLE CONFERENCE",
          clock: "",
        });
        return;
      }

      const diff = start - now;
      const days = Math.round((startDay - kstDay(now)) / 864e5);
      setStrip({
        big: days <= 0 ? "D-DAY" : `D-${days}`,
        label: "UNTIL MIRACLE CONFERENCE",
        clock: [
          pad(Math.floor((diff % 864e5) / 36e5)),
          pad(Math.floor((diff % 36e5) / 6e4)),
          pad(Math.floor((diff % 6e4) / 1e3)),
        ].join(":"),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dday-strip">
      <span className="big">{strip.big}</span>
      <span className="lbl">{strip.label}</span>
      {strip.clock && <span className="clock">{strip.clock}</span>}
    </div>
  );
}
