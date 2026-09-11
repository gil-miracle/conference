import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQtDay, getQtDays } from "@/lib/content";
import QtView from "./QtView";

type Props = { params: Promise<{ day: string }> };

export function generateStaticParams() {
  return getQtDays().map((d) => ({ day: d.day }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day } = await params;
  const found = getQtDay(day);
  return { title: found ? `${found.date} QT — MIRACLE 2026` : "QT" };
}

/** 아침 QT — 통독인 날은 첫 장부터. 나머지 장은 /qt/[day]/[chapter] */
export default async function QtPage({ params }: Props) {
  const { day } = await params;
  const found = getQtDay(day);
  if (!found?.qt) notFound();
  return <QtView found={{ ...found, qt: found.qt }} />;
}
