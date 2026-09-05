import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import {
  READING_BOOK,
  READING_CHAPTERS,
  READING_TRANSLATION,
  getChapter,
} from "@/lib/bible";

type Props = { params: Promise<{ chapter: string }> };

export function generateStaticParams() {
  return READING_CHAPTERS.map((n) => ({ chapter: String(n) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter } = await params;
  return { title: `${READING_BOOK} ${chapter}장 — MIRACLE 2026` };
}

/**
 * 성경 통독 — MIRACLE 2, 조영찬 전도사님 시간.
 *
 * 장을 주소에 넣는다. 물음표 뒤(?ch=)에 두면 그 부분이 정적 렌더링에서 빠져
 * 본문이 HTML에 실리지 않는다 — 열한 장짜리 읽을거리인데 첫 화면이 비고,
 * 현장 와이파이가 흔들리면 아무것도 안 보인다. 경로로 두면 열한 장이 미리
 * 만들어져 열자마자 글이 있다.
 *
 * 그래서 꺾쇠도 단추가 아니라 링크다. 눌러서 가는 곳이 있으면 링크여야
 * 새 탭으로 열든 뒤로 가든 브라우저가 아는 대로 동작한다.
 */
export default async function ReadingChapterPage({ params }: Props) {
  const { chapter } = await params;
  const n = Number(chapter);
  const found = getChapter(n);
  if (!found) notFound();

  const i = READING_CHAPTERS.indexOf(n as (typeof READING_CHAPTERS)[number]);
  const prev = i > 0 ? READING_CHAPTERS[i - 1] : null;
  const next = i < READING_CHAPTERS.length - 1 ? READING_CHAPTERS[i + 1] : null;

  /* 위아래 양쪽에 둔다 — 다 읽고 나면 위 꺾쇠는 화면 밖에 있다 */
  const nav = (where: string) => (
    <div className={`ch-nav ${where}`}>
      {prev ? (
        <Link href={`/reading/${prev}`} aria-label={`${prev}장`}>
          ‹
        </Link>
      ) : (
        <span aria-hidden>‹</span>
      )}
      <b>
        {READING_BOOK} {n}장
      </b>
      {next ? (
        <Link href={`/reading/${next}`} aria-label={`${next}장`}>
          ›
        </Link>
      ) : (
        <span aria-hidden>›</span>
      )}
    </div>
  );

  return (
    <section id="reading">
      <div className="container">
        <BackLink href="/timetable/2">9.12 (토) 일정</BackLink>

        <PageHead
          title={`${READING_BOOK} 통독`}
          lede={`${READING_BOOK} 1~11장을 함께 읽어요.`}
        />

        {nav("top")}

        {found.verses.length > 0 ? (
          <blockquote className="spk-verse reveal">
            {found.verses.map((v) => (
              <p className="v" key={v.n}>
                <b className="vn">{v.n}</b>
                {v.text}
              </p>
            ))}
            <cite>
              {READING_BOOK} {n}장 · {READING_TRANSLATION}
            </cite>
          </blockquote>
        ) : (
          <p className="msg ch-empty">
            {n}장 본문은 준비 중이에요. 성경을 펴서 함께 읽어요.
          </p>
        )}

        {nav("bottom")}
      </div>
    </section>
  );
}
