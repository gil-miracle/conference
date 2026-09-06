import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHead from "@/components/PageHead";
import DayTabs from "@/components/timetable/DayTabs";
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
 * 세 날이 각각 주소를 가지면 카톡으로 "토요일 일정"을 그대로 나눌 수 있다.
 * 다만 탭을 누를 때마다 그 주소로 옮겨 다니지는 않는다 — 화면이 통째로 다시
 * 그려져서 볼 때마다 「일정표」가 사라졌다 다시 떴다. 세 날을 함께 그려 두고
 * 보일 것만 바꾼다(DayTabs).
 */
export default async function TimetableDayPage({ params }: Props) {
  const { day } = await params;
  const found = TIMETABLE.find((d) => d.day === day);
  if (!found) notFound();

  return (
    <section id="timetable">
      <div className="container">
        <PageHead title="일정표" />

        <DayTabs days={TIMETABLE} initial={found.day} />
      </div>
    </section>
  );
}
