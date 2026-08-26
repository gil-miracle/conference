import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import TimetableTabs from "@/components/TimetableTabs";

export const metadata: Metadata = { title: "타임테이블 — MIRACLE 2026" };
/** 콘텐츠가 코드에서만 오므로 매 요청 렌더링할 필요가 없다 */
export const revalidate = 3600;

export default function TimetablePage() {
  return (
    <section id="timetable">
      <div className="container">
        <PageHead
          title="타임테이블"
          idx="TIMETABLE"
          lede="금요일 저녁 등록으로 시작해 주일 예배 후 귀가합니다. 세부 프로그램은 확정되는 대로 업데이트돼요."
        />
        <TimetableTabs />
      </div>
    </section>
  );
}
