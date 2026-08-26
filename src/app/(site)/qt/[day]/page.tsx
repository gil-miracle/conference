import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import { getQtDay, getQtDays } from "@/lib/content";

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

  return (
    <section>
      <div className="container">
        <BackLink href={`/timetable?day=${found.day}`}>
          {found.label} 일정
        </BackLink>

        <PageHead
          title={`${found.date} QT`}
          action={
            <Link className="head-action" href={`/nanum?from=${found.day}`}>
              나눔 순서
            </Link>
          }
        />

        <div className="qt-head reveal">
          <h3>{qt.passage}</h3>
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
      </div>
    </section>
  );
}
