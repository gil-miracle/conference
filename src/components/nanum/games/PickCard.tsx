"use client";

import { useState } from "react";

/**
 * 조건 뽑기 — 무작위 조건을 하나 뽑고, 거기 해당하는 사람이 먼저 나눈다.
 *
 * 다른 게임은 기계가 정하지만 이건 조원끼리 이야기하며 정하게 된다.
 * "누가 제일 멀리서 왔지?"를 확인하는 동안 이미 나눔이 시작된다.
 */
const CONDITIONS = [
  "오늘 가장 먼저 일어난 사람",
  "여기까지 가장 멀리서 온 사람",
  "생일이 가장 빠른 사람",
  "휴대폰 배터리가 가장 많이 남은 사람",
  "이름 가나다순으로 첫 번째 사람",
  "오늘 물을 가장 많이 마신 사람",
  "신발 사이즈가 가장 큰 사람",
  "형제자매가 가장 많은 사람",
  "가장 최근에 이사한 사람",
  "이 컨퍼런스를 가장 먼저 신청한 사람",
  "오늘 아침을 가장 많이 먹은 사람",
  "지금 가장 배고픈 사람",
  "머리를 가장 최근에 자른 사람",
  "이 조에서 가장 늦게 온 사람",
];

export default function PickCard() {
  const [card, setCard] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);

  const draw = () => {
    if (flipping) return;
    setFlipping(true);
    let n = 0;
    const id = setInterval(() => {
      setCard(CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]);
      if (++n >= 9) {
        clearInterval(id);
        setFlipping(false);
      }
    }, 80);
  };

  return (
    <div className="game">
      <div className={`stage${flipping ? " active" : ""}`}>
        {card ? <b>{card}</b> : <span>조건을 뽑아 보세요</span>}
      </div>

      <button className="btn accent full-w" disabled={flipping} onClick={draw}>
        {flipping ? "뽑는 중…" : card ? "다시 뽑기" : "조건 뽑기"}
      </button>

      {card && !flipping && (
        <p className="game-hint">해당하는 분이 먼저 나눠 주세요.</p>
      )}
    </div>
  );
}
