"use client";

import { useRef, useState } from "react";
import ChapterNav from "./ChapterNav";
import type { BibleChapter } from "@/lib/bible";

/**
 * 여러 장 본문 — 장을 다 그려 두고 보일 것만 바꾼다.
 *
 * 꺾쇠가 링크면 장을 넘길 때마다 화면이 통째로 다시 그려져 제목·사람·머리가
 * 사라졌다 다시 뜬다. 바뀌는 것은 본문뿐이어야 한다 — 일정표 날짜 탭(DayTabs)과
 * 같은 방식이다.
 *
 * 열 장을 다 그리는 것은 감춘 값이 아니라 정적 HTML에 실리는 값이다. 어느
 * 장 주소로 들어와도 그 장이 먼저 보이고, 넘기면 주소만 갈아 끼운다 —
 * 카톡으로 「마가복음 5장」을 그대로 나눌 수 있어야 해서 주소는 살아 있다.
 * 기록은 쌓지 않는다. 열 번 넘기고 뒤로 가기를 열 번 하게 할 이유가 없다.
 */
export default function ChapterReader({
  book,
  translation,
  chapters,
  initial,
  base,
}: {
  book: string;
  translation: string;
  chapters: BibleChapter[];
  initial: number;
  /** 장 주소 앞머리 — /reading, /qt/3 */
  base: string;
}) {
  const [at, setAt] = useState(initial);
  const top = useRef<HTMLDivElement>(null);
  const numbers = chapters.map((c) => c.n);

  const go = (next: number, from: "top" | "bottom") => {
    setAt(next);
    window.history.replaceState(null, "", `${base}/${next}`);
    // 아래 꺾쇠로 넘겼으면 새 장의 첫 절이 화면 밖이다 — 본문 머리로 올린다
    if (from === "bottom") top.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div ref={top} className="reader">
      {/* 위아래 양쪽에 둔다 — 다 읽고 나면 위 꺾쇠는 화면 밖에 있다 */}
      <ChapterNav
        book={book}
        chapters={numbers}
        at={at}
        base={base}
        place="top"
        onPick={(n) => go(n, "top")}
      />

      {chapters.map((c) => (
        <div key={c.n} hidden={c.n !== at}>
          {c.verses.length > 0 ? (
            <blockquote className="spk-verse">
              {c.verses.map((v) => (
                <p className="v" key={v.n}>
                  <b className="vn">{v.n}</b>
                  {v.text}
                </p>
              ))}
              <cite>
                {book} {c.n}장 · {translation}
              </cite>
            </blockquote>
          ) : (
            <p className="hint-sm">
              {book} {c.n}장 본문은 준비 중이에요.
            </p>
          )}
        </div>
      ))}

      <ChapterNav
        book={book}
        chapters={numbers}
        at={at}
        base={base}
        place="bottom"
        onPick={(n) => go(n, "bottom")}
      />
    </div>
  );
}
