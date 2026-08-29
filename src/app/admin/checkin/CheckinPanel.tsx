"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { jsonFetcher } from "@/lib/fetcher";
import { INVITED, groupTag } from "@/lib/format";
import { useAdminDemo } from "../AdminMode";
import type { AdminParticipant, AdminRoom, AdminTeam } from "@/lib/types";
import {
  setCheckin,
  unbindParticipant,
  type CheckinResult,
} from "../actions/checkin";
import ParticipantRow from "./ParticipantRow";
import ParticipantDetail from "./ParticipantDetail";
import QrScanner from "./QrScanner";

const DEMO_MSG = "미리보기 모드 — 변경사항은 저장되지 않아요.";

export default function CheckinPanel({
  rooms,
  teams,
}: {
  rooms: AdminRoom[];
  teams: AdminTeam[];
}) {
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detail, setDetail] = useState<AdminParticipant | null>(null);
  const [cell, setCell] = useState("");
  const [arrive, setArrive] = useState("");
  const [stay, setStay] = useState("");
  const [onlyAdmin, setOnlyAdmin] = useState(false);
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

  /* 고를 값은 명단에서 뽑는다 — 폼 선택지가 바뀌어도 따라간다 */
  const uniq = (get: (p: AdminParticipant) => string | null) =>
    [...new Set((data ?? []).map(get).filter(Boolean))].sort() as string[];
  /* 목록 배지와 같은 판단을 쓴다 — 다락방이 없으면 "초청자"로 묶인다.
     초청자는 다락방 이름들 뒤에 둔다 */
  const groups = [...new Set((data ?? []).map(groupTag).filter(Boolean) as string[])].sort(
    (a, b) => (a === INVITED ? 1 : b === INVITED ? -1 : a.localeCompare(b))
  );
  const arriveDays = uniq((p) => p.arrive_day);
  /* 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다.
     날짜 하나씩 고를 수 있어야 "금요일 자는 사람"을 뽑을 수 있다 */
  const stays = [
    ...new Set(
      (data ?? []).flatMap((p) =>
        (p.stay ?? "").split(",").map((x) => x.trim()).filter(Boolean)
      )
    ),
  ].sort();

  const shown = (data ?? []).filter((p) => {
    if (cell && groupTag(p) !== cell) return false;
    if (arrive && p.arrive_day !== arrive) return false;
    // 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다 —
    // 고른 날이 포함되면 잡는다
    if (stay && !(p.stay ?? "").includes(stay)) return false;
    if (onlyAdmin && p.role !== "admin") return false;
    return true;
  });

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
      <div className="filters">
        <select value={cell} onChange={(e) => setCell(e.target.value)}>
          <option value="">다락방 전체</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={arrive} onChange={(e) => setArrive(e.target.value)}>
          <option value="">도착 전체</option>
          {arriveDays.map((d) => (
            <option key={d} value={d}>
              {d} 도착
            </option>
          ))}
        </select>
        <select value={stay} onChange={(e) => setStay(e.target.value)}>
          <option value="">숙박 전체</option>
          {stays.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          className={`chip-toggle${onlyAdmin ? " on" : ""}`}
          onClick={() => setOnlyAdmin(!onlyAdmin)}
        >
          관리자만
        </button>
        <span className="fcount">
          {data ? `${data.length}명 중 ${shown.length}명` : ""}
        </span>
      </div>
      <div className="plist">
        {isLoading && !data && (
          <div className="p-row">
            <div className="info">
              <small>불러오는 중…</small>
            </div>
          </div>
        )}
        {data && shown.length === 0 && (
          <div className="p-row">
            <div className="info">
              <small>
                {q || cell || arrive || stay || onlyAdmin
                  ? "조건에 맞는 사람이 없어요."
                  : "참가자 명단이 비어 있어요 — 설정 탭에서 동기화하세요."}
              </small>
            </div>
          </div>
        )}
        {shown.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            onToggleCheckin={() => onToggleCheckin(participant)}
            onUnbind={() => onUnbind(participant)}
            onOpen={() => setDetail(participant)}
          />
        ))}
      </div>
      <ParticipantDetail
        participant={detail}
        rooms={rooms}
        teams={teams}
        onClose={() => setDetail(null)}
        onChanged={() => mutate()}
      />
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
