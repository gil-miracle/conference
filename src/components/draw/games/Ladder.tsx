"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/Confirm";
import OrderList from "@/components/draw/OrderList";
import { shortName, shuffle } from "@/hooks/useNames";
import { LADDER_ROWS, buildGoodRungs, walk } from "@/lib/ladder";

const TRACE_MS = 1500;
/** 잔상 길이(px)와 조각 수 — 조각마다 흐려지며 꼬리가 된다 */
const TAIL = 96;
const TAIL_STEPS = 7;
const PAD = 10;
const HEIGHT = 220;

type Pt = { x: number; y: number };

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const r1 = (n: number) => Math.round(n * 10) / 10;
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/**
 * 사다리타기.
 *
 * 선을 그려 두는 대신 **머리가 잔상을 끌며 내려간다** — 경로를 눈으로 따라가는
 * 재미가 여기에 있다. 좌표는 픽셀 그대로 쓴다(viewBox를 늘려 쓰면 가로·세로
 * 배율이 달라 속도가 들쭉날쭉해지고 선이 끊겨 보인다).
 *
 * 한 번 누른 이름은 열린 채로 잠긴다 — 결과를 보고 다시 눌러 바꿀 수 있으면
 * 뽑기가 아니다.
 */
export default function Ladder({ names }: { names: string[] }) {
  const confirm = useConfirm();
  const [seed, setSeed] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const [tracing, setTracing] = useState(false);
  const [w, setW] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const tailRefs = useRef<(SVGPathElement | null)[]>([]);
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  const cols = names.length;

  // 픽셀 좌표를 쓰므로 실제 폭을 재야 한다
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const colX = useCallback(
    (i: number) => ((i + 0.5) / cols) * w,
    [cols, w]
  );
  const rowY = useCallback(
    (row: number) => PAD + ((row + 1) * (HEIGHT - PAD * 2)) / (LADDER_ROWS + 1),
    []
  );

  const { rungs, result } = useMemo(() => {
    const list = buildGoodRungs(cols);
    return { rungs: list, result: names.map((_, s) => walk(list, s).end) };
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

  /** 출발 칸의 경로 — 꺾이는 지점을 모두 담고, 구간별 누적 길이를 함께 만든다 */
  const lineOf = useCallback(
    (start: number) => {
      const { end, moves } = walk(rungs, start);
      const pts: Pt[] = [{ x: colX(start), y: PAD }];
      for (const mv of moves) {
        const y = rowY(mv.row);
        pts.push({ x: colX(mv.from), y }, { x: colX(mv.to), y });
      }
      pts.push({ x: colX(end), y: HEIGHT - PAD });

      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
      return { pts, cum, total: cum[cum.length - 1] || 1 };
    },
    [rungs, colX, rowY]
  );

  const clearTrace = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    tailRefs.current.forEach((p) => p?.setAttribute("d", ""));
    if (headRef.current) headRef.current.style.opacity = "0";
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  const play = useCallback(
    (start: number) => {
      clearTrace();
      const line = lineOf(start);

      /** 경로 위 거리 d 지점의 좌표 */
      const at = (d: number): Pt => {
        if (d <= 0) return line.pts[0];
        if (d >= line.total) return line.pts[line.pts.length - 1];
        for (let i = 1; i < line.pts.length; i++) {
          if (line.cum[i] < d) continue;
          const span = line.cum[i] - line.cum[i - 1];
          const f = span === 0 ? 0 : (d - line.cum[i - 1]) / span;
          return {
            x: line.pts[i - 1].x + (line.pts[i].x - line.pts[i - 1].x) * f,
            y: line.pts[i - 1].y + (line.pts[i].y - line.pts[i - 1].y) * f,
          };
        }
        return line.pts[line.pts.length - 1];
      };

      /** from~to 구간만 잘라낸 경로 문자열 — 잔상 조각 하나 */
      const seg = (from: number, to: number) => {
        const a = Math.max(0, from);
        const b = Math.min(line.total, to);
        if (b <= a) return "";
        const s = at(a);
        let d = `M${r1(s.x)} ${r1(s.y)}`;
        for (let i = 1; i < line.pts.length; i++) {
          if (line.cum[i] <= a) continue;
          if (line.cum[i] >= b) break;
          d += `L${r1(line.pts[i].x)} ${r1(line.pts[i].y)}`;
        }
        const e = at(b);
        return `${d}L${r1(e.x)} ${r1(e.y)}`;
      };

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        // 도착하면 꼬리는 걷고 머리만 남긴다 — 번호와 선을 이어 주는 표식
        const end = line.pts[line.pts.length - 1];
        tailRefs.current.forEach((el) => el?.setAttribute("d", ""));
        for (const el of [headRef.current, glowRef.current]) {
          if (!el) continue;
          el.setAttribute("cx", String(r1(end.x)));
          el.setAttribute("cy", String(r1(end.y)));
          el.style.opacity = "1";
        }
        if (raf.current !== null) cancelAnimationFrame(raf.current);
        raf.current = null;
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = null;
        setTracing(false);
      };

      /* 탭이 가려지면 rAF가 멈춘다 — 그대로 두면 이름이 잠긴 채 결과가 안 나온다.
         시간이 지나면 프레임 없이도 끝나도록 타이머를 함께 건다 */
      timer.current = window.setTimeout(finish, TRACE_MS + 250);

      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / TRACE_MS);
        const d = line.total * ease(p);
        const here = at(d);

        for (let t = 0; t < TAIL_STEPS; t++) {
          tailRefs.current[t]?.setAttribute(
            "d",
            seg(d - (TAIL * (t + 1)) / TAIL_STEPS, d - (TAIL * t) / TAIL_STEPS)
          );
        }
        if (headRef.current) {
          headRef.current.setAttribute("cx", String(r1(here.x)));
          headRef.current.setAttribute("cy", String(r1(here.y)));
          headRef.current.style.opacity = "1";
        }
        if (glowRef.current) {
          glowRef.current.setAttribute("cx", String(r1(here.x)));
          glowRef.current.setAttribute("cy", String(r1(here.y)));
          glowRef.current.style.opacity = "1";
        }

        if (p < 1) {
          raf.current = requestAnimationFrame(step);
          return;
        }
        finish();
      };
      raf.current = requestAnimationFrame(step);
    },
    [clearTrace, lineOf]
  );

  useEffect(() => clearTrace, [clearTrace]);

  const open = (i: number) => {
    if (opened.includes(i) || tracing || !w) return;
    setOpened((prev) => (prev.includes(i) ? prev : [...prev, i]));
    setLast(i);
    setTracing(true);
    play(i);
  };

  const reset = async () => {
    // 아직 아무도 안 눌렀으면 지울 것도 없다 — 그때까지 묻지 않는다
    if (opened.length > 0) {
      const ok = await confirm({
        message: "지금까지 나온 순서를 지우고 사다리를 새로 놓을까요?",
        confirmLabel: "다시 놓기",
      });
      if (!ok) return;
    }
    clearTrace();
    setOpened([]);
    setLast(null);
    setTracing(false);
    setSeed((s) => s + 1);
  };

  const left = names.length - opened.length;

  return (
    <div className="game">
      <div className="ladder-names">
        {names.map((n, i) => (
          <button
            key={n}
            className={`lname${opened.includes(i) ? " on" : ""}`}
            title={n}
            disabled={opened.includes(i) || tracing}
            onClick={() => open(i)}
          >
            {shortName(n)}
          </button>
        ))}
      </div>

      <div className="ladder-board" ref={boardRef}>
        <svg className="ladder" viewBox={`0 0 ${w || 1} ${HEIGHT}`} width={w || undefined} height={HEIGHT}>
          {names.map((_, i) => (
            <line key={i} x1={colX(i)} y1={PAD} x2={colX(i)} y2={HEIGHT - PAD} className="rail" />
          ))}
          {rungs.map((g) => (
            <line
              key={`${g.row}-${g.col}`}
              x1={colX(g.col)}
              y1={rowY(g.row)}
              x2={colX(g.col + 1)}
              y2={rowY(g.row)}
              className="rung"
            />
          ))}
          {/* 잔상 — 머리에서 먼 조각일수록 흐리고 가늘다 */}
          {Array.from({ length: TAIL_STEPS }, (_, t) => (
            <path
              key={t}
              ref={(el) => {
                tailRefs.current[t] = el;
              }}
              className="tail"
              strokeOpacity={0.65 * (1 - t / TAIL_STEPS)}
              strokeWidth={r1(2.5 + 3 * (1 - t / TAIL_STEPS))}
            />
          ))}
          <circle ref={glowRef} className="glow" r={13} style={{ opacity: 0 }} />
          <circle ref={headRef} className="head" r={6.5} style={{ opacity: 0 }} />
        </svg>
      </div>

      <div className="ladder-names results">
        {names.map((_, i) => {
          const owner = opened.find((o) => result[o] === i);
          // 내려가는 중인 사람의 칸은 도착할 때까지 덮어 둔다
          const done = owner !== undefined && !(tracing && owner === last);
          return (
            <span key={i} className={`lprize${done ? " on" : ""}`}>
              {done && owner !== undefined ? (
                <>
                  <b>{prizes[i]}번</b>
                  <em title={names[owner]}>{shortName(names[owner])}</em>
                </>
              ) : (
                "?"
              )}
            </span>
          );
        })}
      </div>

      <button className="btn ghost full-w" onClick={reset}>
        사다리 다시 놓기
      </button>

      {/* 다 뽑았으면 칸을 눈으로 훑지 않아도 되게 순서대로 다시 적어 준다 */}
      {left === 0 && !tracing && (
        <OrderList
          names={names
            .map((name, o) => ({ no: prizes[result[o]], name }))
            .sort((a, b) => a.no - b.no)
            .map(({ name }) => name)}
        />
      )}

      <p className="game-hint">
        {left > 0
          ? `이름을 누르면 선을 따라 내려가 순서가 나와요. ${left}명 남았어요.`
          : "모두 확인했어요. 다시 놓기를 누르면 이 순서는 지워져요."}
      </p>
    </div>
  );
}
