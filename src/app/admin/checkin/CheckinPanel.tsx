"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { jsonFetcher } from "@/lib/fetcher";
import { useAdminDemo } from "../AdminMode";
import type { AdminParticipant } from "@/lib/types";
import {
  setCheckin,
  unbindParticipant,
  type CheckinResult,
} from "../actions/checkin";
import ParticipantRow from "./ParticipantRow";
import QrScanner from "./QrScanner";

const DEMO_MSG = "미리보기 모드 — 변경사항은 저장되지 않아요.";

export default function CheckinPanel() {
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const { toast, showToast } = useToast();
  const demo = useAdminDemo();
  const confirm = useConfirm();

  const { data, mutate, isLoading } = useSWR<AdminParticipant[]>(
    `/api/admin/participants?q=${encodeURIComponent(q)}`,
    jsonFetcher<AdminParticipant[]>,
    { refreshInterval: 5000, keepPreviousData: true }
  );

  async function onToggleCheckin(p: AdminParticipant) {
    if (demo) return showToast(DEMO_MSG);
    if (
      p.checked_in_at &&
      !(await confirm({
        message: `${p.name} 체크인을 취소할까요?`,
        confirmLabel: "취소하기",
        danger: true,
      }))
    )
      return;
    const res = await setCheckin(p.id, !p.checked_in_at);
    if (!res.ok) showToast("처리에 실패했어요.", true);
    mutate();
  }

  async function onUnbind(p: AdminParticipant) {
    if (demo) return showToast(DEMO_MSG);
    const ok = await confirm({
      message: `${p.name}의 소셜 계정 연결을 해제할까요? 본인이 다시 로그인해 명단과 연결해야 해요.`,
      confirmLabel: "연결 해제",
      danger: true,
    });
    if (!ok) return;
    const res = await unbindParticipant(p.id);
    if (!res.ok) showToast("해제에 실패했어요.", true);
    else showToast("연결을 해제했어요.");
    mutate();
  }

  // 스캐너 effect 의존성으로 들어가므로 안정된 identity 유지
  const onScanResult = useCallback(
    (result: CheckinResult) => {
      if (result.status === "ok")
        showToast(
          `✓ ${result.name} 체크인${result.room ? ` — ${result.room}` : ""}`
        );
      else if (result.status === "already")
        showToast(`${result.name}님은 이미 체크인했어요.`, true);
      else if (result.status === "not_found")
        showToast("등록되지 않은 QR이에요.", true);
      else showToast("처리에 실패했어요.", true);
      mutate();
    },
    [showToast, mutate]
  );

  return (
    <>
      <div className="qr-strip">
        <button
          className="btn accent qr-main"
          onClick={() => (demo ? showToast(DEMO_MSG) : setScanning(true))}
        >
          QR 스캔
        </button>
        <button className="btn ghost" onClick={() => mutate()}>
          새로고침
        </button>
      </div>
      <div className="search">
        <input
          placeholder="이름 또는 전화번호 뒷자리 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="plist">
        {isLoading && !data && (
          <div className="p-row">
            <div className="info">
              <small>불러오는 중…</small>
            </div>
          </div>
        )}
        {data?.length === 0 && (
          <div className="p-row">
            <div className="info">
              <small>
                {q
                  ? "검색 결과가 없어요."
                  : "참가자 명단이 비어 있어요 — 설정 탭에서 업로드하세요."}
              </small>
            </div>
          </div>
        )}
        {data?.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            onToggleCheckin={() => onToggleCheckin(participant)}
            onUnbind={() => onUnbind(participant)}
          />
        ))}
      </div>
      <p className="panel-hint">
        참가자의 My 화면 QR을 스캔하거나 이름으로 수동 체크인하세요. 소셜 계정이
        잘못 연결된 경우 연결해제 후 본인이 다시 로그인하면 돼요.
      </p>

      {scanning && (
        <QrScanner onResult={onScanResult} onClose={() => setScanning(false)} />
      )}
      <Toast toast={toast} />
    </>
  );
}
