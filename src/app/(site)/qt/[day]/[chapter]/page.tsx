import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQtReading } from "@/lib/bible";
import { getQtDay, getQtDays } from "@/lib/content";
import QtView from "../QtView";

type Props = { params: Promise<{ day: string; chapter: string }> };

/** 통독인 날만 장 주소가 있다 — /qt/3/1 · /qt/3/2 · /qt/3/3 */
export function generateStaticParams() {
  return getQtDays().flatMap((d) =>
    (getQtReading(d.day)?.chapters ?? []).map((c) => ({ day: d.day, chapter: String(c.n) })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day, chapter } = await params;
  const found = getQtDay(day);
  const reading = getQtReading(day);
  return {
    title:
      found && reading
        ? `${found.date} QT · ${reading.book} ${chapter}장 — MIRACLE 2026`
        : "QT",
  };
}

export default async function QtChapterPage({ params }: Props) {
  const { day, chapter } = await params;
  const found = getQtDay(day);
  if (!found?.qt) notFound();
  const n = Number(chapter);
  const reading = getQtReading(day);
  if (!reading || !reading.chapters.some((c) => c.n === n)) notFound();

  return <QtView found={{ ...found, qt: found.qt }} chapter={n} />;
}
