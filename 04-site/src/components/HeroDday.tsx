"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/content";

export default function HeroDday() {
  const [text, setText] = useState({ dd: "D-··", clock: "--:--:--" });

  useEffect(() => {
    const target = new Date(EVENT.startsAt).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5);
      const h = String(Math.floor((diff % 864e5) / 36e5)).padStart(2, "0");
      const m = String(Math.floor((diff % 36e5) / 6e4)).padStart(2, "0");
      const s = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0");
      setText({ dd: diff === 0 ? "D-DAY" : `D-${d}`, clock: `${h}:${m}:${s}` });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dday-strip">
      <span className="big">{text.dd}</span>
      <span className="lbl">UNTIL FIRST GATHERING</span>
      <span className="clock">{text.clock}</span>
    </div>
  );
}
