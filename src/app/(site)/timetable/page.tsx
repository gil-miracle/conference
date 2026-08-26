import type { Metadata } from "next";
import { Suspense } from "react";
import PageHead from "@/components/PageHead";
import TimetableTabs from "@/components/TimetableTabs";

export const metadata: Metadata = { title: "일정표 — MIRACLE 2026" };
/** 콘텐츠가 코드에서만 오므로 매 요청 렌더링할 필요가 없다 */
export const revalidate = 3600;

export default function TimetablePage() {
  return (
    <section id="timetable">
      <div className="container">
        <PageHead
          title="일정표"
          lede="금요일 저녁 등록으로 시작해 주일 예배 후 귀가합니다. 세부 프로그램은 확정되는 대로 업데이트돼요."
        />
        {/* useSearchParams(?day=)를 쓰므로 Suspense가 필요하다.
            대신 페이지는 계속 정적으로 남는다. */}
        <Suspense fallback={null}>
          <TimetableTabs />
        </Suspense>
      </div>
    </section>
  );
}
