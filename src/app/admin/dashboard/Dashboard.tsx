"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/fetcher";
import type { AdminStats } from "@/lib/types";
import DashboardStats from "./DashboardStats";
import RecentCheckins from "./RecentCheckins";

/**
 * 대시보드 — 폴링(SWR 1초). 데스크에서 체크인을 누르면 옆 화면에 바로 보여야
 * 해서 짧게 잡았다. 보는 사람은 운영진 몇 명뿐이고, 탭이 뒤로 가면 SWR가
 * 알아서 멈추므로 서버 부담은 없다. Realtime은 필요해지면 그때 간다.
 */
export default function Dashboard() {
  const { data, error } = useSWR<AdminStats>(
    "/api/admin/stats",
    jsonFetcher<AdminStats>,
    { refreshInterval: 1000 }
  );

  if (error)
    return (
      <p className="msg err">통계를 불러오지 못했어요. 새로고침 해주세요.</p>
    );
  if (!data) return <p className="upd">LOADING…</p>;

  return (
    <>
      <DashboardStats stats={data} />
      <RecentCheckins recent={data.recent} />
    </>
  );
}
