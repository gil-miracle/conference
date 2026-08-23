import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SPEAKERS, getSpeaker } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SPEAKERS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const speaker = getSpeaker(id);
  return { title: speaker ? `${speaker.name} — MIRACLE 2026` : "강사 소개" };
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { id } = await params;
  const speaker = getSpeaker(id);
  if (!speaker) notFound();

  return (
    <section>
      <div className="container">
        <Link className="back-link" href="/speakers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          강사 목록
        </Link>

        <div className="spk-detail reveal">
          <div className="ph">
            {speaker.img ? (
              <img src={`/speakers/${speaker.img}`} alt={speaker.name} />
            ) : (
              <div className="ph-fallback">PHOTO</div>
            )}
          </div>
          <div className="meta">
            <span className="tag">{speaker.tag}</span>
            <h2>{speaker.name}</h2>
            <p className="org">{speaker.org}</p>
          </div>
        </div>

        <div className="sub-head reveal">
          <h3>약력</h3>
        </div>
        <p className="body-text reveal">{speaker.bio}</p>

        <div className="sub-head reveal">
          <h3>담당 세션</h3>
        </div>
        <div className="tt-list reveal">
          {speaker.sessions.map((s) => (
            <div className="tt main" key={`${s.day}-${s.time}`}>
              <time>
                {s.day}
                <br />
                {s.time}
              </time>
              <div>
                <b>{s.title}</b>
              </div>
            </div>
          ))}
        </div>
        <Link className="more-link reveal" href="/timetable">
          전체 타임테이블 보기
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
