"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/fetcher";
import type { AdminStats } from "@/lib/types";
import DashboardStats from "./DashboardStats";
import RecentCheckins from "./RecentCheckins";
import MissingList from "./MissingList";

/** 대시보드 — 설계 확정: v1 폴링(SWR 5초), 필요시 Supabase Realtime 교체 */
export default function Dashboard() {
  const { data, error } = useSWR<AdminStats>(
    "/api/admin/stats",
    jsonFetcher<AdminStats>,
    { refreshInterval: 5000 }
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
      <MissingList missing={data.missing} />
    </>
  );
}
