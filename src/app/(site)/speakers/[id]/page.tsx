import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import SpeakerPhoto from "@/components/SpeakerPhoto";
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
 * 사람 → 약력 → 본문 말씀 순서다. 시각·설교 제목은 일정표가 이미 보여주므로
 * 여기서는 되풀이하지 않고, 그 사람이 어떤 말씀을 여는지로 마무리한다.
 */
export default async function SpeakerDetailPage({ params }: Props) {
  const { id } = await params;
  const speaker = getSpeaker(id);
  if (!speaker) notFound();

  // 목록 페이지가 없으므로 일정표로 되돌아간다 — 그것도 이 사람이 있는 날짜 탭으로.
  const placed = getSpeakerSession(speaker.id);
  const backHref = placed ? `/timetable/${placed.day.day}` : "/timetable";

  return (
    <section>
      <div className="container">
        <BackLink href={backHref}>
          {placed ? `${placed.day.label} 일정` : "일정표"}
        </BackLink>

        <div className="spk-detail reveal">
          <div className="ph">
            <SpeakerPhoto speaker={speaker} />
          </div>
          <div className="meta">
            {speaker.tag && <span className="tag">{speaker.tag}</span>}
            <h2>{speaker.name}</h2>
            {speaker.org && <p className="org">{speaker.org}</p>}
          </div>
        </div>

        {speaker.bio && <p className="body-text reveal">{speaker.bio}</p>}

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
