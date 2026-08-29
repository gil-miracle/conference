"use client";

import { useState } from "react";
import { useConfirm } from "@/components/Confirm";
import { useNames, shortName } from "@/hooks/useNames";
import Shuffle from "./games/Shuffle";
import Ladder from "./games/Ladder";
import Roulette from "./games/Roulette";
import PickCard from "./games/PickCard";
import DrawLots from "./games/DrawLots";
import Bomb from "./games/Bomb";

const GAMES = [
  { key: "shuffle", label: "순서 섞기", hint: "한 번에 전체 순서", icon: "⇄" },
  { key: "ladder", label: "사다리타기", hint: "타고 내려가 배정", icon: "⌗" },
  { key: "lots", label: "제비뽑기", hint: "한 장씩 뒤집기", icon: "✦" },
  { key: "roulette", label: "룰렛", hint: "돌려서 한 명", icon: "◎" },
  { key: "pick", label: "조건 뽑기", hint: "해당하는 사람이", icon: "☞" },
  { key: "bomb", label: "폭탄 돌리기", hint: "멈춘 사람부터", icon: "✸" },
] as const;

type GameKey = (typeof GAMES)[number]["key"];

/**
 * 나눔 순서 정하기.
 *
 * 조 모임에서 "누가 먼저 하지"로 멈칫하는 시간을 없애려는 도구다.
 * 이름은 기기에만 남고 서버로 가지 않는다.
 */
export default function DrawBoard() {
  const { names, loaded, add, remove, clear } = useNames();
  const confirm = useConfirm();
  const [input, setInput] = useState("");
  const [game, setGame] = useState<GameKey | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    add(input);
    setInput("");
  };

  const enough = names.length >= 2;

  return (
    <div className="draw">
      <form className="draw-add" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="이름 입력 — 쉼표로 여러 명도 한 번에"
          aria-label="이름 추가"
        />
        <button className="btn sm accent" disabled={!input.trim()}>
          추가
        </button>
      </form>

      {loaded && names.length > 0 && (
        <>
          <div className="chips">
            {names.map((n) => (
              <button key={n} className="chip-x" title={n} onClick={() => remove(n)}>
                {shortName(n)}
                <i aria-hidden="true">✕</i>
              </button>
            ))}
          </div>
          <button
            className="btn-plain draw-clear"
            onClick={async () => {
              const ok = await confirm({
                message: `명단 ${names.length}명이 모두 지워져요. 계속할까요?`,
                confirmLabel: "전체 지우기",
                danger: true,
              });
              if (ok) clear();
            }}
          >
            전체 지우기
          </button>
        </>
      )}

      {loaded && !enough && (
        <p className="msg">두 명 이상 넣으면 게임을 고를 수 있어요.</p>
      )}

      {enough && (
        <>
          <div className="game-grid">
            {GAMES.map((g) => (
              <button
                key={g.key}
                className={`game-card${game === g.key ? " on" : ""}`}
                onClick={() => setGame(game === g.key ? null : g.key)}
              >
                <span className="ico" aria-hidden="true">
                  {g.icon}
                </span>
                <b>{g.label}</b>
                <small>{g.hint}</small>
              </button>
            ))}
          </div>

          {game === "shuffle" && <Shuffle names={names} />}
          {game === "ladder" && <Ladder names={names} />}
          {game === "lots" && <DrawLots names={names} />}
          {game === "roulette" && <Roulette names={names} />}
          {game === "pick" && <PickCard names={names} />}
          {game === "bomb" && <Bomb names={names} />}
        </>
      )}
    </div>
  );
}
