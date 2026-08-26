"use client";

import { useState } from "react";

const COLORS = [
  "var(--pink)",
  "var(--coral)",
  "var(--orange)",
  "var(--peach)",
  "var(--lavender)",
  "var(--green)",
];

/**
 * 원판은 끝과 처음이 맞닿는다. i % 색수로만 돌리면 인원이 색 수보다 하나 많을 때
 * (7명·13명…) 마지막 조각이 첫 조각과 같은 색으로 붙어 경계가 사라진다.
 * 그때만 한 칸 밀어 이웃끼리 절대 겹치지 않게 한다.
 */
function paletteFor(n: number) {
  const L = COLORS.length;
  return Array.from({ length: n }, (_, i) =>
    i === n - 1 && n > 1 && i % L === 0 ? COLORS[1] : COLORS[i % L]
  );
}

/** 룰렛 — 돌려서 한 명을 고른다 */
export default function Roulette({ names }: { names: string[] }) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const n = names.length;
  const slice = 360 / n;
  const palette = paletteFor(n);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setPicked(null);
    const target = Math.floor(Math.random() * n);
    // 여러 바퀴 돈 뒤 당첨 칸의 한가운데가 위(12시)에 오도록 각도를 맞춘다
    const turns = 4 + Math.floor(Math.random() * 3);
    const next = angle + turns * 360 + (360 - (target * slice + slice / 2));
    setAngle(next);
    setTimeout(() => {
      setPicked(names[target]);
      setSpinning(false);
    }, 3200);
  };

  return (
    <div className="game">
      <div className="wheel-wrap">
        <span className="needle" aria-hidden="true" />
        <svg
          className="wheel"
          viewBox="-1 -1 2 2"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {names.map((name, i) => {
            const a0 = (i * slice - 90) * (Math.PI / 180);
            const a1 = ((i + 1) * slice - 90) * (Math.PI / 180);
            const large = slice > 180 ? 1 : 0;
            const d = `M0 0 L${Math.cos(a0)} ${Math.sin(a0)} A1 1 0 ${large} 1 ${Math.cos(a1)} ${Math.sin(a1)} Z`;
            const mid = (a0 + a1) / 2;
            return (
              <g key={name}>
                <path d={d} fill={palette[i]} />
                <text
                  x={Math.cos(mid) * 0.62}
                  y={Math.sin(mid) * 0.62}
                  transform={`rotate(${(i + 0.5) * slice} ${Math.cos(mid) * 0.62} ${Math.sin(mid) * 0.62})`}
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <button className="btn accent full-w" disabled={spinning} onClick={spin}>
        {spinning ? "도는 중…" : "돌리기"}
      </button>
      {picked && <p className="game-result">{picked}</p>}
    </div>
  );
}
