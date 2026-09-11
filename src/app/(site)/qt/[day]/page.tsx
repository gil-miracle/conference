import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import { getQtDay, getQtDays } from "@/lib/content";
import { READING_TRANSLATION, getQtReading } from "@/lib/bible";

type Props = { params: Promise<{ day: string }> };

export function generateStaticParams() {
  return getQtDays().map((d) => ({ day: d.day }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day } = await params;
  const found = getQtDay(day);
  return { title: found ? `${found.date} QT — MIRACLE 2026` : "QT" };
}

/**
 * 아침 QT — 본문 · 묵상 · 기도.
 * 묵상 질문은 조 모임에서 그대로 읽어 쓸 수 있게 완결된 문장으로 적는다.
 */
export default async function QtPage({ params }: Props) {
  const { day } = await params;
  const found = getQtDay(day);
  if (!found?.qt) notFound();

  const { qt } = found;
  const reading = getQtReading(found.day);

  return (
    <section>
      <div className="container">
        <BackLink href={`/timetable/${found.day}`}>
          {found.label} 일정
        </BackLink>

        <PageHead
          title={`${found.date} QT`}
          action={
            <Link className="head-action" href={`/draw?from=${found.day}`}>
              나눔 순서 정하기
            </Link>
          }
        />

        <div className="qt-head reveal">
          <h3>{qt.passage}</h3>
          {qt.theme && <p className="qt-theme">{qt.theme}</p>}
        </div>

        <blockquote className="spk-verse reveal">
          {qt.verses.map((v) => (
            <p className="v" key={v.n}>
              <b className="vn">{v.n}</b>
              {v.text}
            </p>
          ))}
          <cite>{qt.passage} · 우리말성경</cite>
        </blockquote>
        {/* 전문을 다 실을 수 없는 날이 있다 — 줄였다면 그 사실을 적는다 */}
        {qt.note && <p className="qt-note reveal">{qt.note}</p>}

        <div className="sub-head reveal">
          <h3>묵상</h3>
        </div>
        <ol className="qt-reflect reveal">
          {qt.reflect.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>

        <div className="sub-head reveal">
          <h3>기도</h3>
        </div>
        <p className="qt-pray reveal">{qt.pray}</p>

        {/* 그날 함께 읽는 통독 — 마가복음 통독 화면과 같은 본문 모양, 장마다 제목 */}
        {reading && (
          <>
            <div className="sub-head reveal">
              <h3>
                통독 · {reading.book} {reading.chapters[0]?.n}~
                {reading.chapters[reading.chapters.length - 1]?.n}장
              </h3>
            </div>
            {reading.chapters.map((ch) => (
              <div className="qt-reading" key={ch.n}>
                <h4 className="qt-ch">
                  {reading.book} {ch.n}장
                </h4>
                <blockquote className="spk-verse">
                  {ch.verses.map((v) => (
                    <p className="v" key={v.n}>
                      <b className="vn">{v.n}</b>
                      {v.text}
                    </p>
                  ))}
                  <cite>
                    {reading.book} {ch.n}장 · {READING_TRANSLATION}
                  </cite>
                </blockquote>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
