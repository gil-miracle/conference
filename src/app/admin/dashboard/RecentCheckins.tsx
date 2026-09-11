"use client";

import { useState } from "react";
import { fmtTime } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

/** 한 쪽에 보이는 사람 수 — 열 명이면 데스크 화면 하나에 들어온다 */
const PAGE = 10;

/**
 * 체크인 피드 — 최근 순. 이력 테이블은 없고 checked_in_at으로만 세운다.
 * 데스크에서 바로 안내할 것(방·조·방장·조장·티셔츠·강의 신청)을 한 줄에 붙인다.
 *
 * 열 명씩 쪽을 나눈다. 예순 명이 한 줄로 늘어서면 맨 아래 QR 스캔 단추가
 * 화면 여러 장 아래로 밀린다. 첫 쪽에 있으면 새로 찍힌 사람이 위에 바로 붙는다.
 */
export default function RecentCheckins({
  recent,
}: {
  recent: AdminStats["recent"];
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(recent.length / PAGE));
  // 폴링으로 목록이 줄어 쪽이 사라졌으면 마지막 쪽으로
  const at = Math.min(page, pages - 1);
  const shown = recent.slice(at * PAGE, at * PAGE + PAGE);

  return (
    <>
      <div className="sec-title">
        <b>체크인</b>
        {pages > 1 && (
          <span className="feed-pager">
            <button
              type="button"
              aria-label="이전 쪽"
              disabled={at === 0}
              onClick={() => setPage(at - 1)}
            >
              ‹
            </button>
            <span>
              {at + 1} / {pages}
            </span>
            <button
              type="button"
              aria-label="다음 쪽"
              disabled={at >= pages - 1}
              onClick={() => setPage(at + 1)}
            >
              ›
            </button>
          </span>
        )}
      </div>
      <div className="feed">
        {recent.length === 0 && (
          <div className="row empty">아직 체크인한 참가자가 없어요.</div>
        )}
        {shown.map((row, i) => (
          <div className="row ci" key={`${row.name}-${i}`}>
            <span className="who">
              <b>{row.name}</b>
              <span className="tags">
                <span
                  className={`chip${row.room ? (row.room_leader ? " on" : "") : " off"}`}
                >
                  {row.room ?? "방 미배정"}
                  {row.room_leader && <b> · 방장</b>}
                </span>
                <span
                  className={`chip${row.team ? (row.team_leader ? " on" : "") : " off"}`}
                >
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
