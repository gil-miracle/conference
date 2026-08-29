"use client";

import { useState } from "react";
import { useConfirm } from "@/components/Confirm";
import OrderList from "@/components/draw/OrderList";
import { shortName, shuffle } from "@/hooks/useNames";

/**
 * 제비뽑기 — 한 사람씩 카드를 뒤집어 자기 순서를 확인한다.
 * 한 번에 다 나오는 '순서 섞기'와 달리, 뽑는 재미가 남는다.
 */
export default function DrawLots({ names }: { names: string[] }) {
  const confirm = useConfirm();
  const [deck, setDeck] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);

  const start = async () => {
    // 이미 뒤집은 카드가 있으면 그 결과가 사라진다
    if (flipped.length > 0) {
      const ok = await confirm({
        message: "지금까지 뒤집은 제비를 지우고 새로 만들까요?",
        confirmLabel: "다시 섞기",
      });
      if (!ok) return;
    }
    setDeck(shuffle(names.map((_, i) => i + 1)));
    setFlipped([]);
  };

  const cards = deck.length > 0 ? deck : names.map(() => 0);
  const done = flipped.length === names.length && deck.length > 0;

  return (
    <div className="game">
      <div className="lots">
        {cards.map((v, i) => {
          // 뒤집힌 차례가 곧 뽑은 사람 — flipped[t]를 t번째 사람이 뒤집었다
          const turn = flipped.indexOf(i);
          const open = turn >= 0;
          return (
            <button
              key={i}
              className={`lot${open ? " open" : ""}`}
              title={open ? names[turn] : undefined}
              disabled={deck.length === 0}
              onClick={() => !open && setFlipped((f) => [...f, i])}
            >
              {open ? (
                <>
                  <b>{v}</b>
                  <em>{shortName(names[turn])}</em>
                </>
              ) : (
                <span>?</span>
              )}
            </button>
          );
        })}
      </div>

      <button className="btn accent full-w" onClick={start}>
        {deck.length ? "다시 섞기" : "제비 만들기"}
      </button>

      {deck.length === 0 ? (
        <p className="game-hint">제비를 만든 뒤 한 장씩 뒤집어 주세요.</p>
      ) : done ? (
        <OrderList
          names={deck
            .map((v, i) => ({ v, name: names[i] }))
            .sort((a, b) => a.v - b.v)
            .map(({ name }) => name)}
        />
      ) : (
        <p className="game-hint">
          {names[flipped.length]} 님 차례예요 — 아무 카드나 뒤집으세요.
        </p>
      )}
    </div>
  );
}
