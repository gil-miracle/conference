import { fmtTime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export default function DashboardStats({ stats }: { stats: AdminStats }) {
  const pct =
    stats.total > 0
      ? Math.round((stats.checked_in / stats.total) * 1000) / 10
      : 0;
  // 운영진 기기 시간대와 무관하게 행사 시간대(KST)로 — 아래 피드 시각과 같은 기준
  const updated = fmtTime(new Date().toISOString());

  return (
    <>
      <div className="stat-grid">
        <div className="stat hot">
          <div className="n">
            {stats.checked_in}
            <em> / {stats.total}</em>
          </div>
          <div className="l">CHECKED IN</div>
        </div>
        <div className="stat">
          <div className="n">{stats.total - stats.checked_in}</div>
          <div className="l">NOT ARRIVED</div>
        </div>
        <div className="stat">
          <div className="n">
            {stats.rooms_used}
            <em> / {stats.rooms_total}</em>
          </div>
          <div className="l">ROOMS USED</div>
        </div>
        <div className={`stat${stats.pending > 0 ? " hot" : ""}`}>
          <div className="n">{stats.pending}</div>
          <div className="l">가입 승인 대기</div>
        </div>
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="upd">
        {pct}% ARRIVED · 갱신 {updated}
      </p>
    </>
  );
}
