"use client";

import { fmtTime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export default function RecentCheckins({
  recent,
}: {
  recent: AdminStats["recent"];
}) {
  return (
    <>
      <div className="sec-title">
        <b>최근 체크인</b>
        <span>LIVE · 5s</span>
      </div>
      <div className="feed">
        {recent.length === 0 && (
          <div className="row empty">아직 체크인한 참가자가 없어요.</div>
        )}
        {recent.map((row, i) => (
          <div className="row" key={`${row.name}-${i}`}>
            <span>
              <b>{row.name}</b>
              {row.room ? ` · ${row.room}` : ""}
            </span>
            <time>{fmtTime(row.checked_in_at)}</time>
          </div>
        ))}
      </div>
    </>
  );
}
