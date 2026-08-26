"use client";

import { useState } from "react";
import { shuffle } from "@/hooks/useNames";

/**
 * 제비뽑기 — 한 사람씩 카드를 뒤집어 자기 순서를 확인한다.
 * 한 번에 다 나오는 '순서 섞기'와 달리, 뽑는 재미가 남는다.
 */
export default function DrawLots({ names }: { names: string[] }) {
  const [deck, setDeck] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);

  const start = () => {
    setDeck(shuffle(names.map((_, i) => i + 1)));
    setFlipped([]);
  };

  const cards = deck.length > 0 ? deck : names.map(() => 0);
  const done = flipped.length === names.length && deck.length > 0;

  return (
    <div className="game">
      <div className="lots">
        {cards.map((v, i) => {
          const open = flipped.includes(i);
          return (
            <button
              key={i}
              className={`lot${open ? " open" : ""}`}
              disabled={deck.length === 0}
              onClick={() => !open && setFlipped((f) => [...f, i])}
            >
              {open ? <b>{v}</b> : <span>?</span>}
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
        <ol className="order-list">
          {deck
            .map((v, i) => ({ v, name: names[i] }))
            .sort((a, b) => a.v - b.v)
            .map(({ v, name }) => (
              <li key={name}>
                <span className="no">{String(v).padStart(2, "0")}</span>
                <b>{name}</b>
              </li>
            ))}
        </ol>
      ) : (
        <p className="game-hint">
          {names[flipped.length]} 님 차례예요 — 아무 카드나 뒤집으세요.
        </p>
      )}
    </div>
  );
}
