import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import SpeakerHead from "@/components/SpeakerHead";
import { SPEAKERS, getSpeaker, getSpeakerSession } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SPEAKERS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const speaker = getSpeaker(id);
  return { title: speaker ? `${speaker.name} — MIRACLE 2026` : "설교자" };
}

/**
 * 설교자 상세.
 *
 * 사람(태그에 주제어) → 설교 제목·본문 출처 → 본문 말씀 순서다.
 * 시각은 일정표가 이미 보여주므로 되풀이하지 않고, 약력은 싣지 않는다 —
 * 이 화면은 그 사람이 여는 말씀을 읽는 자리다.
 */
export default async function SpeakerDetailPage({ params }: Props) {
  const { id } = await params;
  const speaker = getSpeaker(id);
  if (!speaker) notFound();

  // 목록 페이지가 없으므로 일정표로 되돌아간다 — 그것도 이 사람이 있는 날짜 탭으로.
  const placed = getSpeakerSession(speaker.id);
  const backHref = placed ? `/timetable/${placed.day.day}` : "/timetable/1";

  return (
    <section>
      <div className="container">
        <BackLink href={backHref}>
          {placed ? `${placed.day.label} 일정` : "일정표"}
        </BackLink>

        <SpeakerHead speaker={speaker} item={placed?.item} />

        {placed?.item.sermonTitle && (
          /* 제목 → 본문 출처 순. 주제어는 위 태그에 붙어 있다 */
          <div className="sermon-head reveal">
            <h3>{placed.item.sermonTitle}</h3>
            {placed.item.sermonTitleReading && (
              <p className="reading">{placed.item.sermonTitleReading}</p>
            )}
            {placed.item.verse && (
              <p className="passage">
                <span aria-hidden="true">📖</span> {placed.item.verse}
              </p>
            )}
          </div>
        )}

        {placed?.item.verseText && (
          <blockquote className="spk-verse reveal">
            {/* 절마다 줄을 바꾸고, 접힌 줄은 번호 폭만큼 들여쓴다 */}
            {placed.item.verseText.map((v) => (
              <p className="v" key={v.n}>
                <b className="vn">{v.n}</b>
                {v.text}
              </p>
            ))}
            <cite>{placed.item.verse} · 우리말성경</cite>
          </blockquote>
        )}
      </div>
    </section>
  );
}
