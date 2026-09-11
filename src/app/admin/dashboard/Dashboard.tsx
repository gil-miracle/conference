"use client";

import useSWR from "swr";
import { ADMIN_POLL_MS, jsonFetcher } from "@/lib/fetcher";
import type { AdminStats } from "@/lib/types";
import DashboardStats from "./DashboardStats";
import RecentCheckins from "./RecentCheckins";

/**
 * 대시보드 — 폴링(SWR). 데스크에서 체크인을 누르면 옆 화면에 곧 보여야 해서
 * 주기는 짧고, 참가자 명단·가입 승인과 같은 값(ADMIN_POLL_MS)을 쓴다.
 * Realtime은 필요해지면 그때 간다.
 */
export default function Dashboard() {
  const { data, error } = useSWR<AdminStats>(
    "/api/admin/stats",
    jsonFetcher<AdminStats>,
    { refreshInterval: ADMIN_POLL_MS },
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
