import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHead from "@/components/PageHead";
import DaySchedule from "@/components/timetable/DaySchedule";
import { TIMETABLE } from "@/lib/content";

type Props = { params: Promise<{ day: string }> };

export function generateStaticParams() {
  return TIMETABLE.map((d) => ({ day: d.day }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day } = await params;
  const found = TIMETABLE.find((d) => d.day === day);
  return {
    title: found ? `${found.date} 일정 — MIRACLE 2026` : "일정표 — MIRACLE 2026",
  };
}

/**
 * 하루치 일정.
 *
 * 날짜를 주소 경로에 둔다. 물음표 뒤(?day=)에 두면 그 부분이 정적 렌더링에서
 * 빠져 일정이 HTML에 하나도 실리지 않는다 — 행사장에서 제일 많이 여는
 * 화면인데 껍데기만 받고 JS를 기다린다.
 *
 * 탭도 단추가 아니라 링크다. 세 날이 각각 주소를 가지면 카톡으로 "토요일
 * 일정"을 그대로 나눌 수 있고, 뒤로 가기가 앞 날로 돌아간다.
 */
export default async function TimetableDayPage({ params }: Props) {
  const { day } = await params;
  const found = TIMETABLE.find((d) => d.day === day);
  if (!found) notFound();

  return (
    <section id="timetable">
      <div className="container">
        <PageHead title="일정표" />

        <div className="day-tabs">
          {TIMETABLE.map((d) => (
            <Link
              key={d.day}
              href={`/timetable/${d.day}`}
              className={d.day === found.day ? "on" : ""}
              aria-current={d.day === found.day ? "page" : undefined}
            >
              {d.label}
            </Link>
          ))}
        </div>

        <DaySchedule day={found} />
      </div>
    </section>
  );
}
