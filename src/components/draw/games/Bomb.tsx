"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OrderList from "@/components/draw/OrderList";
import { shortName } from "@/hooks/useNames";
import { useOrderPicks } from "@/hooks/useOrderPicks";

/**
 * 폭탄 돌리기 — 이름을 빠르게 훑다가 아무 때나 멈춘다. 멈춘 사람이 다음 차례.
 * 멈추는 시각을 미리 정해두지 않아, 돌리는 사람도 결과를 모른다.
 *
 * 멈춘 사람은 명단에서 빠지고 순서가 아래에 쌓인다 — 한 번 돌려 한 명만
 * 정하면 나머지는 다시 "누가 먼저 하지"로 돌아간다.
 */
export default function Bomb({ names }: { names: string[] }) {
  const { taken, pool, done, take, reset, busy } = useOrderPicks(names, "다시 돌리기");
  const [at, setAt] = useState(0);
  const [running, setRunning] = useState(false);
  /** 멈춘 사람 — 명단에서 빠진 뒤에도 화면에는 그대로 남아야 한다 */
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* 지금 가리키는 칸을 ref로도 들고 있는다. setState 갱신 함수 안에서 다른
     setState를 부르면 React가 그 함수를 두 번 실행할 때 값이 겹친다 */
  const atRef = useRef(0);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const roster = names.join(" ");
  useEffect(() => {
    setPicked(null);
    atRef.current = 0;
    setAt(0);
    setRunning(false);
  }, [roster]);

  const start = () => {
    if (busy.current || done) return;
    busy.current = true;
    setRunning(true);
    setPicked(null);
    atRef.current = 0;
    setAt(0);

    const round = pool;
    // 1.2~2.8초. 더 끌면 다 같이 화면만 보고 있게 된다
    const endAt = Date.now() + 1200 + Math.random() * 1600;
    const tick = () => {
      atRef.current = (atRef.current + 1) % round.length;
      setAt(atRef.current);
      if (Date.now() >= endAt) {
        busy.current = false;
        setRunning(false);
        setPicked(round[atRef.current]);
        take(round[atRef.current]);
        return;
      }
      // 끝으로 갈수록 느려져 긴장이 붙는다
      const left = endAt - Date.now();
      timer.current = setTimeout(tick, left < 700 ? 200 : 70);
    };
    timer.current = setTimeout(tick, 70);
  };

  /* 돌아가는 중이면 훑고 있는 이름, 멈췄으면 뽑힌 이름.
     멈춘 뒤 pool로 계산하면 그 사람이 빠져 나가 옆 사람이 뜬다 — 발표와 명단이 어긋난다 */
  const showing = running
    ? pool[Math.min(at, pool.length - 1)]
    : (picked ?? pool[0] ?? null);

  return (
    <div className="game">
      <div className={`stage${running ? " active" : ""}`}>
        {showing ? <b>{shortName(showing, 8)}</b> : <span>모두 정했어요</span>}
      </div>

      {done ? (
        <button
          className="btn ghost full-w"
          onClick={() =>
            reset(() => {
              stop();
              setPicked(null);
              atRef.current = 0;
              setAt(0);
              setRunning(false);
            })
          }
        >
          다시 돌리기
        </button>
      ) : (
        <button className="btn accent full-w" disabled={running} onClick={start}>
          {running ? "돌아가는 중…" : taken.length ? "다음 돌리기" : "폭탄 돌리기"}
        </button>
      )}

      <OrderList names={taken} highlightLast />

      <p className="game-hint">
        {done
          ? "모두 정했어요. 다시 돌리기를 누르면 이 순서는 지워져요."
          : pool.length === 2
            ? "돌리면 두 사람 순서가 한 번에 정해져요."
            : `멈춘 사람이 다음 차례예요. ${pool.length}명 남았어요.`}
      </p>
    </div>
  );
}
