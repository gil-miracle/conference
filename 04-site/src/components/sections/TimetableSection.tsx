import SectionHead from "@/components/SectionHead";
import TimetableTabs from "@/components/TimetableTabs";

export default function TimetableSection() {
  return (
    <section id="timetable">
      <div className="container">
        <SectionHead title="타임테이블" idx="03 — TIMETABLE" />
        <p className="lede reveal">모든 시간은 임시입니다. 확정되면 업데이트돼요.</p>
        <TimetableTabs />
      </div>
    </section>
  );
}
