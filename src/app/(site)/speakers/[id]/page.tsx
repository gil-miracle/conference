import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import MoreLink from "@/components/MoreLink";
import SpeakerPhoto from "@/components/SpeakerPhoto";
import SessionRow from "@/components/timetable/SessionRow";
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
        <BackLink href="/speakers">강사 목록</BackLink>

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

        {/* 약력·담당 세션은 확정된 것만 보여준다 (빈 제목만 남지 않게) */}
        {speaker.bio && (
          <>
            <div className="sub-head reveal">
              <h3>약력</h3>
            </div>
            <p className="body-text reveal">{speaker.bio}</p>
          </>
        )}

        {speaker.sessions.length > 0 && (
          <>
            <div className="sub-head reveal">
              <h3>담당 세션</h3>
            </div>
            <div className="ss-list reveal">
              {speaker.sessions.map((s) => (
                <SessionRow
                  key={`${s.day}-${s.time}`}
                  item={{ time: `${s.day} · ${s.time}`, title: s.title, main: true }}
                />
              ))}
            </div>
          </>
        )}
        <MoreLink href="/timetable">전체 타임테이블 보기</MoreLink>
      </div>
    </section>
  );
}
