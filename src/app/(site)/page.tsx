import Link from "next/link";
import HeroSection from "@/components/sections/HeroSection";
import SectionHead from "@/components/SectionHead";
import MoreLink from "@/components/MoreLink";
import SpeakerCard from "@/components/SpeakerCard";
import NextSessions from "@/components/home/NextSessions";
import { EVENT, SPEAKERS, THEME_VERSE, ABOUT_LEDE } from "@/lib/content";
import { getGuestbook, getSiteContext } from "@/lib/data/site";
import { fmtDateTime } from "@/lib/format";

/** 방명록 미리보기만 DB에서 오므로 짧게 캐시 — 정적 렌더로 prefetch가 동작한다 */
export const revalidate = 60;

export default async function HomePage() {
  const [ctx, guestbook] = await Promise.all([getSiteContext(), getGuestbook(3)]);
  const menus = ctx.menus;

  return (
    <>
      <HeroSection />

      {/* 주제 — 요약 */}
      {menus.about && (
        <section id="about">
          <div className="container">
            <SectionHead title="주제 및 장소" idx="01 — ABOUT" />
            <p className="lede reveal">{ABOUT_LEDE}</p>
            <div className="verse reveal">
              <p>{THEME_VERSE.text}</p>
              <span className="ref">{THEME_VERSE.ref}</span>
            </div>
            <div className="place reveal">
              <div className="in">
                <b>{EVENT.venue}</b>
                <p>{EVENT.venueSub}</p>
              </div>
            </div>
            <MoreLink href="/about">장소·오시는 길·영상 보기</MoreLink>
          </div>
        </section>
      )}

      {/* 강사 — 카드 4장 */}
      {menus.speakers && (
        <section id="speakers">
          <div className="container">
            <SectionHead title="강사 소개" idx="02 — SPEAKERS" />
            <div className="spk-grid reveal">
              {SPEAKERS.map((speaker) => (
                <Link key={speaker.id} href={`/speakers/${speaker.id}`} className="spk-link">
                  <SpeakerCard speaker={speaker} />
                </Link>
              ))}
            </div>
            <MoreLink href="/speakers">강사별 상세 보기</MoreLink>
          </div>
        </section>
      )}

      {/* 타임테이블 — 다음 세션만 */}
      {menus.timetable && (
        <section id="timetable">
          <div className="container">
            <SectionHead title="타임테이블" idx="03 — TIMETABLE" />
            <NextSessions />
            <MoreLink href="/timetable">3일 전체 일정 보기</MoreLink>
          </div>
        </section>
      )}

      {/* 방명록 — 최근 3개 */}
      {menus.guestbook && (
        <section id="guestbook">
          <div className="container">
            <SectionHead title="방명록" idx="04 — GUESTBOOK" />
            <div className="reveal">
              {guestbook.length === 0 && (
                <p className="lede" style={{ padding: "10px 0 4px" }}>
                  첫 번째 인사를 남겨주세요.
                </p>
              )}
              {guestbook.map((entry) => (
                <div className="gb" key={entry.id}>
                  <div className="row">
                    <b>{entry.display_name}</b>
                    <time>{fmtDateTime(entry.created_at)}</time>
                  </div>
                  <p>{entry.content}</p>
                </div>
              ))}
            </div>
            <MoreLink href="/guestbook">방명록 전체 보기 · 글 남기기</MoreLink>
          </div>
        </section>
      )}
    </>
  );
}
