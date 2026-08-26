"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 폭탄 돌리기 — 이름을 빠르게 훑다가 아무 때나 멈춘다. 멈춘 사람이 먼저.
 * 멈추는 시각을 미리 정해두지 않아, 돌리는 사람도 결과를 모른다.
 */
export default function Bomb({ names }: { names: string[] }) {
  const [at, setAt] = useState(0);
  const [running, setRunning] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = () => {
    if (running) return;
    setRunning(true);
    setPicked(null);

    // 1.2~2.8초. 더 끌면 다 같이 화면만 보고 있게 된다
    const endAt = Date.now() + 1200 + Math.random() * 1600;
    const tick = () => {
      setAt((i) => (i + 1) % names.length);
      if (Date.now() >= endAt) {
        setRunning(false);
        setAt((i) => {
          setPicked(names[i]);
          return i;
        });
        return;
      }
      // 끝으로 갈수록 느려져 긴장이 붙는다
      const left = endAt - Date.now();
      timer.current = setTimeout(tick, left < 700 ? 200 : 70);
    };
    timer.current = setTimeout(tick, 70);
  };

  return (
    <div className="game">
      <div className={`bomb${running ? " running" : ""}`}>
        <b>{picked ?? names[at]}</b>
      </div>

      <button className="btn accent full-w" disabled={running} onClick={start}>
        {running ? "돌아가는 중…" : picked ? "다시 돌리기" : "폭탄 돌리기"}
      </button>

      {picked && <p className="game-result">{picked} 님부터!</p>}
    </div>
  );
}
