"use client";

import { useState } from "react";
import OrderList from "@/components/draw/OrderList";
import { shortName } from "@/hooks/useNames";
import { useOrderPicks } from "@/hooks/useOrderPicks";

/**
 * 조건 뽑기 — 무작위 조건을 하나 뽑고, 해당하는 사람을 눌러 순서를 쌓는다.
 *
 * 다른 게임은 기계가 정하지만 이건 조원끼리 이야기하며 정하게 된다.
 * "누가 제일 멀리서 왔지?"를 확인하는 동안 이미 나눔이 시작된다.
 */
const CONDITIONS = [
  // 오늘·지금 — 확인이 제일 빠르다
  "오늘 가장 먼저 일어난 사람",
  "오늘 가장 늦게 일어난 사람",
  "지금 가장 배고픈 사람",
  "오늘 물을 가장 많이 마신 사람",
  "오늘 아침을 가장 많이 먹은 사람",
  "이 조에서 가장 늦게 온 사람",
  "여기까지 가장 멀리서 온 사람",
  "오늘 걸음 수가 가장 많은 사람",
  "휴대폰 배터리가 가장 많이 남은 사람",
  "휴대폰 배터리가 가장 적게 남은 사람",
  "지금 가장 두꺼운 옷을 입은 사람",
  "오늘 사진을 가장 많이 찍은 사람",

  // 나에 대한 것 — 서로 몰랐던 걸 알게 된다
  "생일이 가장 빠른 사람",
  "생일이 가장 늦은 사람",
  "이름 가나다순으로 첫 번째 사람",
  "이름 가나다순으로 마지막 사람",
  "형제자매가 가장 많은 사람",
  "신발 사이즈가 가장 큰 사람",
  "머리를 가장 최근에 자른 사람",
  "가장 최근에 이사한 사람",
  "집에서 교회까지 가장 오래 걸리는 사람",
  "안경을 쓴 사람 중 가장 왼쪽에 앉은 사람",
  "휴대폰 잠금 화면이 사람 사진인 사람",
  "오늘 입은 옷에 파란색이 있는 사람",

  // 컨퍼런스·신앙 — 이 자리에서만 물을 수 있는 것
  "이 컨퍼런스를 가장 먼저 신청한 사람",
  "이 컨퍼런스에 가장 늦게 신청한 사람",
  "이런 수련회에 가장 여러 번 와 본 사람",
  "이런 수련회가 이번이 처음인 사람",
  "교회를 가장 오래 다닌 사람",
  "이 조에서 가장 최근에 교회에 온 사람",
  "오늘 QT를 가장 먼저 편 사람",
  "가장 좋아하는 찬양 제목이 바로 떠오르는 사람",
  "지금 기도 제목이 가장 많은 사람",
  "이 조 이름을 가장 먼저 외운 사람",

  // 조 안에서 — 서로 보면 바로 정해진다
  "이 조에서 가장 목소리가 큰 사람",
  "이 조에서 웃음소리가 가장 잘 들리는 사람",
  "왼쪽 사람 이름을 가장 늦게 외운 사람",
  "오른쪽 사람과 가장 먼저 인사한 사람",
  "손이 가장 따뜻한 사람",
];

export default function PickCard({ names }: { names: string[] }) {
  const { taken, pool, done, take, reset, busy } = useOrderPicks(names, "다시 뽑기");
  const [card, setCard] = useState<string | null>(null);
  const [used, setUsed] = useState<string[]>([]);
  const [flipping, setFlipping] = useState(false);

  const draw = () => {
    if (busy.current || done) return;
    busy.current = true;
    setFlipping(true);
    // 한 번 나온 조건은 다시 안 나오게 — 같은 질문을 두 번 하면 김이 샌다
    const fresh = CONDITIONS.filter((c) => !used.includes(c));
    const bag = fresh.length ? fresh : CONDITIONS;
    let n = 0;
    let showing = bag[0];
    const id = setInterval(() => {
      showing = bag[Math.floor(Math.random() * bag.length)];
      setCard(showing);
      if (++n >= 9) {
        clearInterval(id);
        busy.current = false;
        setFlipping(false);
        // 갱신 함수 안에서 다른 setState를 부르면 두 번 실행될 때 값이 겹친다
        setUsed((prev) => (fresh.length ? [...prev, showing] : [showing]));
      }
    }, 80);
  };

  /** 조건에 해당하는 사람을 눌러 순서에 넣는다 */
  const pick = (name: string) => {
    if (flipping) return;
    take(name);
    setCard(null);
  };

  const clearAll = () =>
    reset(() => {
      setUsed([]);
      setCard(null);
      setFlipping(false);
    });

  return (
    <div className="game">
      <div className={`stage${flipping ? " active" : ""}`}>
        {done ? (
          <span>모두 정했어요</span>
        ) : card ? (
          <b>{card}</b>
        ) : (
          <span>조건을 뽑아 보세요</span>
        )}
      </div>

      {done ? (
        <button className="btn ghost full-w" onClick={clearAll}>
          다시 뽑기
        </button>
      ) : (
        <button className="btn accent full-w" disabled={flipping} onClick={draw}>
          {flipping ? "뽑는 중…" : card ? "다른 조건 뽑기" : "조건 뽑기"}
        </button>
      )}

      {/* 기계가 못 정하는 자리 — 조건에 맞는 사람을 조원이 눌러 준다 */}
      {card && !flipping && !done && (
        // 한 줄에 몰아넣지 않고 접히게 — 열 명이 넘으면 한 줄로는 글자가 뭉개진다
        <div className="pick-names">
          {pool.map((n) => (
            <button key={n} className="lname" title={n} onClick={() => pick(n)}>
              {shortName(n)}
            </button>
          ))}
        </div>
      )}

      <OrderList names={taken} highlightLast />

      <p className="game-hint">
        {done
          ? "모두 정했어요. 다시 뽑기를 누르면 이 순서는 지워져요."
          : card && !flipping
            ? `해당하는 분을 눌러 주세요. ${pool.length}명 남았어요.`
            : `조건을 뽑고 해당하는 분을 누르면 순서가 쌓여요. ${pool.length}명 남았어요.`}
      </p>
    </div>
  );
}
