import { fmtTime } from "@/lib/format";
import type { AdminStats, StatTrio } from "@/lib/types";

/**
 * 카드 하나 — 큰 수는 전체, 그 아래 지체 · 교역자 · 멘토로 나눈 값.
 * `of`가 있으면 「n / m」 꼴로 분모까지 보인다 (체크인 87 / 120 처럼).
 */
function Stat({
  label,
  value,
  of,
  hot,
}: {
  label: string;
  value: StatTrio;
  of?: StatTrio;
  hot?: boolean;
}) {
  // 0 / 0인 갈래는 숨긴다 — 금요일 카드에 멘토 0 / 0이 붙어 있으면 읽는 데 방해만 된다
  const parts = (
    [
      ["지체", "members"],
      ["교역자", "pastors"],
      ["멘토", "mentors"],
    ] as const
  )
    .filter(([, k]) => value[k] > 0 || (of ? of[k] > 0 : false))
    .map(([name, k]) => `${name} ${of ? `${value[k]} / ${of[k]}` : value[k]}`);
  return (
    <div className={`stat${hot ? " hot" : ""}`}>
      <div className="n">
        {value.all}
        {of && <em> / {of.all}</em>}
        {parts.length > 0 && <em className="sub">{parts.join(" · ")}</em>}
      </div>
      <div className="l">{label}</div>
    </div>
  );
}

export default function DashboardStats({ stats }: { stats: AdminStats }) {
  const pct =
    stats.total.all > 0
      ? Math.round((stats.checked_in.all / stats.total.all) * 1000) / 10
      : 0;
  // 운영진 기기 시간대와 무관하게 행사 시간대(KST)로 — 아래 피드 시각과 같은 기준
  const updated = fmtTime(new Date().toISOString());

  return (
    <>
      <div className="stat-grid">
        <Stat label="전체 인원" value={stats.total} />
        <Stat label="체크인" value={stats.checked_in} of={stats.total} hot />
        <Stat label="금요일 도착" value={stats.fri_in} of={stats.fri_total} />
        <Stat label="토요일 도착" value={stats.sat_in} of={stats.sat_total} />
        <Stat label="시스템 가입" value={stats.joined} of={stats.total} />
        <Stat
          label="미가입"
          value={stats.not_joined}
          of={stats.total}
          hot={stats.not_joined.all > 0}
        />
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      {/* 승인 대기·참가 취소는 여기 적지 않는다 — 데스크에서 보는 줄은 도착률과
          갱신 시각뿐이다. 대기는 참가자 탭의 가입 승인에, 취소는 명단에 있다 */}
      <p className="upd">
        {pct}% ARRIVED · 갱신 {updated}
      </p>
    </>
  );
}
