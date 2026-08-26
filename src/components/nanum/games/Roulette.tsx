"use client";

import { useState } from "react";

/**
 * 원판 색 20가지 — 노을(핑크·코랄·오렌지) → 들판(연두·초록) → 저녁(청록·라벤더).
 * 스무 명까지는 이웃끼리 색이 겹치지 않고, 그보다 많으면 처음부터 다시 돈다.
 * 전부 중간 밝기라 잉크색 글자가 어디서든 읽힌다.
 */
const COLORS = [
  "#f0a8a2", "#e98d86", "#dc5a51", "#cf6f5e", "#e8956b",
  "#efa447", "#f2b96a", "#f6bca6", "#eccfa8", "#d9c67e",
  "#b9c98a", "#8fbf8a", "#6aae86", "#4f9b84", "#3f8a7e",
  "#5f8fa8", "#7f97c0", "#a79bc8", "#b98fc0", "#cf8fb2",
];

/**
 * 원판은 끝과 처음이 맞닿는다. i % 색수로만 돌리면 인원이 색 수보다 하나 많을 때
 * 마지막 조각이 첫 조각과 같은 색으로 붙어 경계가 사라진다.
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

    /*
     * 바늘은 12시에 고정이고 원판이 돈다. 조각 i의 한가운데는 처음에
     * i*slice + slice/2 (시계방향)에 있으므로, 회전각이
     *   -(target*slice + slice/2)  (mod 360)
     * 일 때 그 조각이 바늘 아래 온다.
     *
     * 이전 각도에 그냥 더하면 두 번째 판부터 어긋난다 — 남은 각을 상쇄하지 않아
     * 화면에 멈춘 칸과 발표되는 이름이 달라진다. 절대 각도로 맞춘다.
     */
    const desired = (360 - (target * slice + slice / 2)) % 360;
    const current = ((angle % 360) + 360) % 360;
    const delta = (desired - current + 360) % 360;
    const turns = 4 + Math.floor(Math.random() * 3);

    setAngle(angle + turns * 360 + delta);
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
        {spinning ? "도는 중…" : picked ? "다시 돌리기" : "돌리기"}
      </button>

      {picked && <p className="game-result">{picked}</p>}
    </div>
  );
}
