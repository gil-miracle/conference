"use client";

import { useSearchParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import { getQtDay } from "@/lib/content";

/**
 * 되돌아가기.
 *
 * QT 화면에서 넘어왔으면(`?from=2`) 그 QT로, 아니면 일정표로 보낸다.
 * 브라우저 뒤로가기에만 기대면 주소를 직접 열었을 때 나갈 길이 없다.
 */
export default function DrawBack() {
  const from = useSearchParams().get("from");
  const day = from ? getQtDay(from) : null;

  return day ? (
    <BackLink href={`/qt/${day.day}`}>{day.date} QT</BackLink>
  ) : (
    <BackLink href="/timetable">일정표</BackLink>
  );
}
