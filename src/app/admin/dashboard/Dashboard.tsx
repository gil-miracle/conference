"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { ADMIN_POLL_MS, jsonFetcher } from "@/lib/fetcher";
import type { AdminStats } from "@/lib/types";
import { useAdminDemo } from "../AdminMode";
import type { CheckinResult } from "../actions/checkin";
import QrScanner from "../checkin/QrScanner";
import DashboardStats from "./DashboardStats";
import RecentCheckins from "./RecentCheckins";

/**
 * 대시보드 — 폴링(SWR). 데스크에서 체크인을 누르면 옆 화면에 곧 보여야 해서
 * 주기는 짧고, 참가자 명단·가입 승인과 같은 값(ADMIN_POLL_MS)을 쓴다.
 * Realtime은 필요해지면 그때 간다.
 */
export default function Dashboard() {
  const { data, error, mutate } = useSWR<AdminStats>(
    "/api/admin/stats",
    jsonFetcher<AdminStats>,
    { refreshInterval: ADMIN_POLL_MS },
  );
  /* QR 스캔은 여기서 연다 — 데스크는 대시보드를 띄워 두고 있고, 찍히면 바로
     위 피드에 붙는 것이 보여야 한다. 명단 화면에서 열면 결과를 보러 탭을 옮긴다 */
  const [scanning, setScanning] = useState(false);
  const { toast, showToast } = useToast();
  const demo = useAdminDemo();
  // 스캐너 effect 의존성으로 들어가므로 안정된 identity 유지
  const onScanResult = useCallback(
    (result: CheckinResult) => {
      if (result.status === "ok") showToast(`✓ ${result.name} 체크인 완료`);
      else if (result.status === "already")
        showToast(`${result.name}님은 이미 체크인했어요.`, true);
      else if (result.status === "not_found")
        showToast("등록되지 않은 QR이에요.", true);
      else showToast("처리에 실패했어요.", true);
      mutate();
    },
    [showToast, mutate],
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
      <button
        className="btn accent full dash-scan"
        onClick={() =>
          demo
            ? showToast("미리보기 모드 — 변경사항은 저장되지 않아요.")
            : setScanning(true)
        }
      >
        QR 스캔
      </button>
      {scanning && (
        <QrScanner onResult={onScanResult} onClose={() => setScanning(false)} />
      )}
      <Toast toast={toast} />
    </>
  );
}
