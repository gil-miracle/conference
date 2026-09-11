import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import ChapterNav from "@/components/reading/ChapterNav";
import SpeakerHead from "@/components/SpeakerHead";
import {
  READING_BOOK,
  READING_CHAPTERS,
  READING_TRANSLATION,
  getChapter,
} from "@/lib/bible";
import { getSpeaker, getSpeakerSession } from "@/lib/content";

/** 이 시간을 여는 사람 — 일정표의 배정 한 곳(speakerId)에서 가져온다 */
const READING_SPEAKER_ID = "cho-youngchan";

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
 * 머리는 다른 말씀 화면과 같다 — 사람 → 제목 → 본문. 장 넘김만 그 사이에 선다.
 *
 * 장을 주소에 넣는다. 물음표 뒤(?ch=)에 두면 그 부분이 정적 렌더링에서 빠져
 * 본문이 HTML에 실리지 않는다 — 열한 장짜리 읽을거리인데 첫 화면이 비고,
 * 현장 와이파이가 흔들리면 아무것도 안 보인다. 경로로 두면 열한 장이 미리
 * 만들어져 열자마자 글이 있다.
 *
 * 그래서 꺾쇠도 단추가 아니라 링크다. 눌러서 가는 곳이 있으면 링크여야
 * 새 탭으로 열든 뒤로 가든 브라우저가 아는 대로 동작한다. 가운데 제목만
 * 고르개라 — 한 장씩 넘기는 것과 멀리 건너뛰는 것은 다른 일이다.
 */
export default async function ReadingChapterPage({ params }: Props) {
  const { chapter } = await params;
  const n = Number(chapter);
  const found = getChapter(n);
  if (!found) notFound();

  const speaker = getSpeaker(READING_SPEAKER_ID);
  const placed = getSpeakerSession(READING_SPEAKER_ID);

  return (
    <section id="reading">
      <div className="container">
        <BackLink href="/timetable/2">9.12 (토) 일정</BackLink>

        {speaker && <SpeakerHead speaker={speaker} item={placed?.item} />}

        <div className="sermon-head reveal">
          <h3>{placed?.item.sermonTitle ?? `${READING_BOOK} 통독`}</h3>
        </div>

        {/* 위아래 양쪽에 둔다 — 다 읽고 나면 위 꺾쇠는 화면 밖에 있다 */}
        <ChapterNav
          book={READING_BOOK}
          chapters={READING_CHAPTERS}
          at={n}
          place="top"
        />

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

        <ChapterNav
          book={READING_BOOK}
          chapters={READING_CHAPTERS}
          at={n}
          place="bottom"
        />
      </div>
    </section>
  );
}
