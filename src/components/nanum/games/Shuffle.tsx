"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/Confirm";
import OrderList from "@/components/nanum/OrderList";
import { shuffle } from "@/hooks/useNames";

/** 순서 섞기 — 한 번에 전체 순서를 정한다. 가장 빠른 방법. */
export default function Shuffle({ names }: { names: string[] }) {
  const confirm = useConfirm();
  // 누르기 전에도 명단이 보이게 — 빈 화면에서 시작하면 뭘 섞는지 알 수 없다
  const [order, setOrder] = useState<string[]>(names);
  const [spinning, setSpinning] = useState(false);
  // 확인 창을 기다리는 동안에도 두 번 눌릴 수 있어 동기 잠금을 함께 둔다
  const busy = useRef(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    if (busy.current) return;
    busy.current = true;
    // 이미 나온 순서가 있으면 지워진다고 알린다 — 이미 나눔이 돌고 있을 수 있다
    if (done) {
      const ok = await confirm({
        message: "지금 순서를 지우고 새로 섞을까요?",
        confirmLabel: "다시 섞기",
      });
      if (!ok) {
        busy.current = false;
        return;
      }
    }
    setSpinning(true);
    // 결과가 즉시 나오면 뽑았다는 느낌이 없어 잠깐 섞는 모습을 보여준다
    let n = 0;
    const id = setInterval(() => {
      setOrder(shuffle(names));
      if (++n >= 8) {
        clearInterval(id);
        busy.current = false;
        setSpinning(false);
        setDone(true);
      }
    }, 70);
  };

  return (
    <div className="game">
      <OrderList names={order} dim={spinning} />

      <button className="btn accent full-w" disabled={spinning} onClick={run}>
        {spinning ? "섞는 중…" : done ? "다시 섞기" : "순서 섞기"}
      </button>

      {done && !spinning && (
        <p className="game-hint">다시 섞기를 누르면 이 순서는 지워져요.</p>
      )}
    </div>
  );
}
