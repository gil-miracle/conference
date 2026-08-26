"use client";

import { useState } from "react";
import { shuffle } from "@/hooks/useNames";

/** 순서 섞기 — 한 번에 전체 순서를 정한다. 가장 빠른 방법. */
export default function Shuffle({ names }: { names: string[] }) {
  // 누르기 전에도 명단이 보이게 — 빈 화면에서 시작하면 뭘 섞는지 알 수 없다
  const [order, setOrder] = useState<string[]>(names);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);

  const run = () => {
    if (spinning) return;
    setSpinning(true);
    // 결과가 즉시 나오면 뽑았다는 느낌이 없어 잠깐 섞는 모습을 보여준다
    let n = 0;
    const id = setInterval(() => {
      setOrder(shuffle(names));
      if (++n >= 8) {
        clearInterval(id);
        setSpinning(false);
        setDone(true);
      }
    }, 70);
  };

  return (
    <div className="game">
      <ol className={`order-list${spinning ? " spinning" : ""}`}>
        {order.map((n, i) => (
          <li key={n}>
            <span className="no">{done ? String(i + 1).padStart(2, "0") : "—"}</span>
            <b>{n}</b>
          </li>
        ))}
      </ol>

      <button className="btn accent full-w" disabled={spinning} onClick={run}>
        {spinning ? "섞는 중…" : done ? "다시 섞기" : "순서 섞기"}
      </button>
    </div>
  );
}
