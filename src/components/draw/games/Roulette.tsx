"use client";

import { useEffect, useState } from "react";
import OrderList from "@/components/draw/OrderList";
import { shortName } from "@/hooks/useNames";
import { useOrderPicks } from "@/hooks/useOrderPicks";

const SPIN_MS = 3200;

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

/**
 * 룰렛 — 돌릴 때마다 한 명이 뽑혀 원판에서 빠지고, 아래 명단에 순서대로 쌓인다.
 *
 * 뽑힌 조각은 **다음 판을 돌릴 때** 사라진다. 멈추자마자 지우면 바늘이
 * 엉뚱한 사람을 가리킨 채 남아 "누가 걸린 거지?"가 된다.
 */
export default function Roulette({ names }: { names: string[] }) {
  const { taken, pool, done, take, reset, busy } = useOrderPicks(names, "다시 뽑기");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  /** 지금 원판에 그려진 이름 — 방금 뽑힌 사람이 아직 남아 있을 수 있다 */
  const [wheel, setWheel] = useState<string[]>(names);

  const roster = names.join(" ");
  useEffect(() => {
    setWheel(names);
    setSpinning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster]);

  const n = wheel.length;
  const slice = 360 / n;
  const palette = paletteFor(n);

  const spin = () => {
    if (busy.current || done) return;
    busy.current = true;

    // 방금 뽑힌 사람을 이 시점에 뺀다 — 돌기 시작하므로 조각이 바뀌어도 안 보인다
    const round = pool;
    setWheel(round);
    setSpinning(true);

    const size = 360 / round.length;
    const target = Math.floor(Math.random() * round.length);

    /*
     * 바늘은 12시에 고정이고 원판이 돈다. 조각 i의 한가운데는 처음에
     * i*size + size/2 (시계방향)에 있으므로, 회전각이
     *   -(target*size + size/2)  (mod 360)
     * 일 때 그 조각이 바늘 아래 온다.
     *
     * 이전 각도에 그냥 더하면 두 번째 판부터 어긋난다 — 남은 각을 상쇄하지 않아
     * 화면에 멈춘 칸과 발표되는 이름이 달라진다. 절대 각도로 맞춘다.
     * (조각 수가 판마다 달라져도 절대 각도라 그대로 성립한다)
     */
    const desired = (360 - (target * size + size / 2)) % 360;
    const current = ((angle % 360) + 360) % 360;
    const delta = (desired - current + 360) % 360;
    const turns = 4 + Math.floor(Math.random() * 3);

    setAngle(angle + turns * 360 + delta);
    setTimeout(() => {
      busy.current = false;
      setSpinning(false);
      take(round[target]);
    }, SPIN_MS);
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
          {n === 1 ? (
            // 한 명만 남으면 조각이 원 하나다 — 호로 그리면 시작점과 끝점이 겹쳐 안 그려진다
            <g>
              <circle cx={0} cy={0} r={1} fill={palette[0]} />
              <text x={0} y={-0.62}>
                {shortName(wheel[0])}
              </text>
            </g>
          ) : (
            wheel.map((name, i) => {
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
                    {shortName(name)}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {done ? (
        <button
          className="btn ghost full-w"
          onClick={() => reset(() => setWheel(names))}
        >
          다시 뽑기
        </button>
      ) : (
        <button className="btn accent full-w" disabled={spinning} onClick={spin}>
          {spinning ? "도는 중…" : taken.length ? "다음 뽑기" : "돌리기"}
        </button>
      )}

      <OrderList names={taken} highlightLast />

      <p className="game-hint">
        {done
          ? "모두 정했어요. 다시 뽑기를 누르면 이 순서는 지워져요."
          : pool.length === 2
            ? "돌리면 두 사람 순서가 한 번에 정해져요."
            : `돌릴 때마다 한 명씩 빠져요. ${pool.length}명 남았어요.`}
      </p>
    </div>
  );
}
