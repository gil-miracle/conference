"use client";

import { useEffect, useMemo, useState } from "react";
import { shuffle } from "@/hooks/useNames";

const ROWS = 9;
const TRACE_MS = 1200;

type Rung = { row: number; left: number };

/**
 * 사다리타기.
 *
 * 가로줄을 무작위로 놓고 위에서 내려오며 만나는 가로줄마다 옆 칸으로 옮긴다.
 * 같은 행에 이웃한 가로줄은 두지 않는다(경로가 갈라지지 않게).
 */
export default function Ladder({ names }: { names: string[] }) {
  const [seed, setSeed] = useState(0);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [tracing, setTracing] = useState(false);

  const cols = names.length;
  const W = 100;
  const H = 60;
  const colX = (i: number) => ((i + 0.5) / cols) * W;
  const rowY = (row: number) => ((row + 1) / (ROWS + 1)) * H;

  const { rungs, result } = useMemo(() => {
    const list: Rung[] = [];
    for (let row = 0; row < ROWS; row++) {
      const used = new Set<number>();
      for (let left = 0; left < cols - 1; left++) {
        if (used.has(left - 1)) continue;
        if (Math.random() < 0.45) {
          list.push({ row, left });
          used.add(left);
        }
      }
    }
    const end: number[] = [];
    for (let start = 0; start < cols; start++) {
      let at = start;
      for (let row = 0; row < ROWS; row++) {
        if (list.some((r) => r.row === row && r.left === at)) at += 1;
        else if (list.some((r) => r.row === row && r.left === at - 1)) at -= 1;
      }
      end.push(at);
    }
    return { rungs: list, result: end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, seed]);

  /*
   * 도착 칸에 붙는 순서표. 사다리와 무관하게 한 번 섞는다.
   *
   * 이게 공정성을 담보한다 — 가로줄이 아홉 줄뿐이라 섞임이 약해서, 그대로 두면
   * 왼쪽 사람이 앞 번호를 받을 확률이 훨씬 높다(측정: 31% 대 3.7%).
   * 번호를 도착 칸에 무작위로 붙이면 그 치우침이 상쇄돼, 어느 칸에서 출발하든
   * 모든 번호를 같은 확률로 받는다(측정: 6명 기준 16.6~17.0%).
   */
  const prizes = useMemo(
    () => shuffle(names.map((_, i) => i + 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, seed]
  );

  /** 출발 칸에서 내려오는 실제 경로 — 꺾이는 지점을 모두 담는다 */
  const trace = useMemo(() => {
    if (revealed === null) return null;
    const pts: [number, number][] = [[colX(revealed), 0]];
    let at = revealed;
    for (let row = 0; row < ROWS; row++) {
      const y = rowY(row);
      if (rungs.some((r) => r.row === row && r.left === at)) {
        pts.push([colX(at), y], [colX(at + 1), y]);
        at += 1;
      } else if (rungs.some((r) => r.row === row && r.left === at - 1)) {
        pts.push([colX(at), y], [colX(at - 1), y]);
        at -= 1;
      }
    }
    pts.push([colX(at), H]);
    return pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, rungs, cols]);

  // 선이 다 내려온 뒤에 번호를 보여준다 — 결과가 먼저 뜨면 볼 이유가 없다
  useEffect(() => {
    if (revealed === null) return;
    setTracing(true);
    const id = setTimeout(() => setTracing(false), TRACE_MS);
    return () => clearTimeout(id);
  }, [revealed]);

  const reset = () => {
    setRevealed(null);
    setSeed((s) => s + 1);
  };

  return (
    <div className="game">
      <div className="ladder-names">
        {names.map((n, i) => (
          <button
            key={n}
            className={`lname${revealed === i ? " on" : ""}`}
            onClick={() => setRevealed(revealed === i ? null : i)}
          >
            {n}
          </button>
        ))}
      </div>

      <svg className="ladder" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {names.map((_, i) => (
          <line key={i} x1={colX(i)} y1={0} x2={colX(i)} y2={H} className="rail" />
        ))}
        {rungs.map((r) => (
          <line
            key={`${r.row}-${r.left}`}
            x1={colX(r.left)}
            y1={rowY(r.row)}
            x2={colX(r.left + 1)}
            y2={rowY(r.row)}
            className="rung"
          />
        ))}
        {trace && (
          // key로 다시 그리게 해 누를 때마다 애니메이션이 처음부터 돈다.
          // pathLength=1로 정규화해야 viewBox가 늘어나도 선이 고르게 그려진다.
          <path key={`${seed}-${revealed}`} className="trace" d={trace} pathLength={1} />
        )}
      </svg>

      <div className="ladder-names results">
        {names.map((_, i) => {
          const show = revealed !== null && !tracing && result[revealed] === i;
          return (
            <span key={i} className={`lprize${show ? " on" : ""}`}>
              {show ? `${prizes[i]}번` : "?"}
            </span>
          );
        })}
      </div>

      <p className="game-hint">이름을 누르면 선을 따라 내려가 순서가 나와요.</p>
      <button className="btn ghost full-w" onClick={reset}>
        사다리 다시 놓기
      </button>
    </div>
  );
}
