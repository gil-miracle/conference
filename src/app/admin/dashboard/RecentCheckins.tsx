import { fmtTime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

/**
 * 체크인 피드 — 최근 순. 이력 테이블은 없고 checked_in_at으로만 세운다.
 * 데스크에서 바로 안내할 것(방·조·방장·조장·티셔츠·강의 신청)을 한 줄에 붙인다.
 */
export default function RecentCheckins({
  recent,
}: {
  recent: AdminStats["recent"];
}) {
  return (
    <>
      <div className="sec-title">
        <b>체크인</b>
      </div>
      <div className="feed">
        {recent.length === 0 && (
          <div className="row empty">아직 체크인한 참가자가 없어요.</div>
        )}
        {recent.map((row, i) => (
          <div className="row ci" key={`${row.name}-${i}`}>
            <span className="who">
              <b>{row.name}</b>
              <span className="tags">
                <span className={`chip${row.room ? (row.room_leader ? " on" : "") : " off"}`}>
                  {row.room ?? "방 미배정"}
                  {row.room_leader && <b> · 방장</b>}
                </span>
                <span className={`chip${row.team ? (row.team_leader ? " on" : "") : " off"}`}>
                  {row.team ?? "조 미배정"}
                  {row.team_leader && <b> · 조장</b>}
                </span>
                <span className={`chip${row.tshirt ? " on" : " off"}`}>
                  {row.tshirt ? `티셔츠 ${row.tshirt}` : "티셔츠 없음"}
                </span>
                <span className={`chip${row.mentor ? " on" : " off"}`}>
                  {row.mentor ? `강의 · ${row.mentor}` : "강의 신청 안 함"}
                </span>
              </span>
            </span>
            <time>{fmtTime(row.checked_in_at)}</time>
          </div>
        ))}
      </div>
    </>
  );
}
