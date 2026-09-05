"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  READING_BOOK,
  READING_CHAPTERS,
  READING_TRANSLATION,
  type BibleChapter,
} from "@/lib/bible";

/**
 * 장을 넘겨 가며 읽는다.
 *
 * 열한 장을 탭으로 늘어놓으면 좁은 화면에서 숫자만 빼곡해진다. 통독은 앞에서
 * 뒤로 읽는 일이라 「이전 / 지금 / 다음」 셋이면 충분하다.
 *
 * 장은 주소(?ch=)에 남긴다 — 읽던 데를 링크로 나눌 수 있고, 뒤로 가기가
 * 페이지를 벗어나지 않고 앞 장으로 돌아간다.
 */
export default function ChapterReader({
  chapters,
}: {
  /** 1~11장 전부. 본문이 아직 없는 장은 verses가 비어 있다 */
  chapters: BibleChapter[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const asked = Number(params.get("ch"));
  const current = (READING_CHAPTERS as readonly number[]).includes(asked)
    ? asked
    : READING_CHAPTERS[0];

  const i = READING_CHAPTERS.indexOf(current as (typeof READING_CHAPTERS)[number]);
  const prev = i > 0 ? READING_CHAPTERS[i - 1] : null;
  const next = i < READING_CHAPTERS.length - 1 ? READING_CHAPTERS[i + 1] : null;

  const chapter = chapters.find((c) => c.n === current);
  const go = (n: number) => {
    router.replace(`/reading?ch=${n}`, { scroll: false });
    // 장을 넘기면 본문 처음부터 — 앞 장 끝에서 읽던 자리에 그대로 서 있으면
    // 새 장의 첫 절을 놓친다
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="ch-nav reveal">
        <button
          type="button"
          aria-label="앞 장"
          disabled={!prev}
          onClick={() => prev && go(prev)}
        >
          ‹
        </button>
        <b>
          {READING_BOOK} {current}장
        </b>
        <button
          type="button"
          aria-label="다음 장"
          disabled={!next}
          onClick={() => next && go(next)}
        >
          ›
        </button>
      </div>

      {chapter && chapter.verses.length > 0 ? (
        <blockquote className="spk-verse reveal">
          {chapter.verses.map((v) => (
            <p className="v" key={v.n}>
              <b className="vn">{v.n}</b>
              {v.text}
            </p>
          ))}
          <cite>
            {READING_BOOK} {current}장 · {READING_TRANSLATION}
          </cite>
        </blockquote>
      ) : (
        <p className="msg reveal ch-empty">
          {current}장 본문은 준비 중이에요. 성경을 펴서 함께 읽어요.
        </p>
      )}

      {/* 아래에도 둔다 — 다 읽고 나면 위 단추는 화면 밖에 있다 */}
      <div className="ch-nav bottom reveal">
        <button
          type="button"
          aria-label="앞 장"
          disabled={!prev}
          onClick={() => prev && go(prev)}
        >
          ‹
        </button>
        <b>
          {READING_BOOK} {current}장
        </b>
        <button
          type="button"
          aria-label="다음 장"
          disabled={!next}
          onClick={() => next && go(next)}
        >
          ›
        </button>
      </div>
    </>
  );
}
