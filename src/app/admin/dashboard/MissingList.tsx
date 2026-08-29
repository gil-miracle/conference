import { maskPhone } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export default function MissingList({
  missing,
}: {
  missing: AdminStats["missing"];
}) {
  return (
    <>
      <div className="sec-title">
        <b>미도착</b>
      </div>
      <div className="feed">
        {missing.length === 0 && <div className="row empty">전원 도착! 🎉</div>}
        {missing.map((row, i) => (
          <div className="row" key={`${row.name}-${i}`}>
            <span>
              {row.name} <span className="chip">{maskPhone(row.phone)}</span>
            </span>
            <span className="chip">{row.room ?? "미배정"}</span>
          </div>
        ))}
      </div>
    </>
  );
}
