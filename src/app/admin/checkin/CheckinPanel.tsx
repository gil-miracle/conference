"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { jsonFetcher } from "@/lib/fetcher";
import { INVITED, groupTag } from "@/lib/format";
import { SIGNUP_FIELDS } from "@/lib/participant-fields";
import { useAdminDemo } from "../AdminMode";
import type { AdminParticipant, AdminRoom, AdminTeam } from "@/lib/types";
import {
  setCheckin,
  unbindParticipant,
  type CheckinResult,
} from "../actions/checkin";
import ParticipantRow from "./ParticipantRow";
import ParticipantDetail from "./ParticipantDetail";
import AddParticipant from "./AddParticipant";
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [cell, setCell] = useState("");
  const [arrive, setArrive] = useState("");
  const [stay, setStay] = useState("");
  /* 있음/없음 둘 다 필요해서 토글이 아니라 셋 중 하나로 둔다 — 데스크에서
     실제로 뽑는 건 "아직 안 온 사람", "아직 연결 안 한 사람" 쪽이다 */
  const [joined, setJoined] = useState("");
  const [checked, setChecked] = useState("");
  const [onlyAdmin, setOnlyAdmin] = useState(false);

  /* 걸어 둔 것이 하나라도 있으면 초기화를 낸다 — 다섯 개를 하나씩
     되돌리다 보면 어느 것이 남았는지 모른다 */
  const filtered = Boolean(cell || arrive || stay || joined || checked || onlyAdmin);
  const clearFilters = () => {
    setCell("");
    setArrive("");
    setStay("");
    setJoined("");
    setChecked("");
    setOnlyAdmin(false);
  };
  const { toast, showToast } = useToast();
  const demo = useAdminDemo();
  const confirm = useConfirm();

  const { data, mutate, isLoading } = useSWR<AdminParticipant[]>(
    `/api/admin/participants?q=${encodeURIComponent(q)}`,
    jsonFetcher<AdminParticipant[]>,
    { refreshInterval: 5000, keepPreviousData: true }
  );

  /* 상세는 id로만 들고 목록에서 다시 찾는다 — 객체를 붙들고 있으면 저장·해제
     뒤에도 옛 값을 보여주고, 지워진 사람이 계속 떠 있는다 */
  const detail = (data ?? []).find((p) => p.id === detailId) ?? null;

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

  /* 신청 항목은 자유 문구라 고정 선택지를 둘 수 없다 — 이미 쓰인 값을 폼에
     후보로 넘겨 손으로 넣는 사람도 같은 문구를 쓰게 한다 */
  const options = useMemo(() => {
    const o: Record<string, string[]> = {};
    for (const f of SIGNUP_FIELDS)
      o[f.key] = [
        ...new Set((data ?? []).map((p) => p[f.key]).filter(Boolean) as string[]),
      ].sort();
    return o;
  }, [data]);

  const shown = (data ?? []).filter((p) => {
    if (cell && groupTag(p) !== cell) return false;
    if (arrive && p.arrive_day !== arrive) return false;
    // 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다 —
    // 고른 날이 포함되면 잡는다
    if (stay && !(p.stay ?? "").includes(stay)) return false;
    if (joined && (joined === "y") !== Boolean(p.auth_user_id)) return false;
    if (checked && (checked === "y") !== Boolean(p.checked_in_at)) return false;
    if (onlyAdmin && p.role !== "admin") return false;
    return true;
  });

  return (
    <>
      <div className="sec-title">
        <b>참가자 명단</b>
      </div>
      <div className="qr-strip">
        <button
          className="btn accent qr-main"
          onClick={() => (demo ? showToast(DEMO_MSG) : setScanning(true))}
        >
          QR 스캔
        </button>
        <button className="btn ghost" onClick={() => setAdding(true)}>
          참가자 추가
        </button>
      </div>
      <div className="search">
        <input
          placeholder="이름 또는 전화번호 뒷자리 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {/* 걸어 둔 조건이 하나라도 있으면 초기화가 나온다 */}
      <div className="filters">
        <select
          className={cell ? "on" : undefined}
          value={cell}
          onChange={(e) => setCell(e.target.value)}>
          <option value="">다락방 전체</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className={arrive ? "on" : undefined}
          value={arrive}
          onChange={(e) => setArrive(e.target.value)}>
          <option value="">도착 전체</option>
          {arriveDays.map((d) => (
            <option key={d} value={d}>
              {d} 도착
            </option>
          ))}
        </select>
        <select
          className={stay ? "on" : undefined}
          value={stay}
          onChange={(e) => setStay(e.target.value)}>
          <option value="">숙박 전체</option>
          {stays.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className={joined ? "on" : undefined}
          value={joined}
          onChange={(e) => setJoined(e.target.value)}>
          <option value="">가입 전체</option>
          <option value="y">가입함</option>
          <option value="n">미가입</option>
        </select>
        <select
          className={checked ? "on" : undefined}
          value={checked}
          onChange={(e) => setChecked(e.target.value)}>
          <option value="">체크인 전체</option>
          <option value="y">체크인함</option>
          <option value="n">미체크인</option>
        </select>
        <button
          className={`chip-toggle${onlyAdmin ? " on" : ""}`}
          onClick={() => setOnlyAdmin(!onlyAdmin)}
        >
          관리자만
        </button>
        {filtered && (
          <button className="fclear" onClick={clearFilters}>
            초기화
          </button>
        )}
        <span className="fcount">
          {data ? (
            <>
              {data.length}명 중 <b>{shown.length}</b>명
            </>
          ) : (
            ""
          )}
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
                {q || cell || arrive || stay || joined || checked || onlyAdmin
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
            onOpen={() => setDetailId(participant.id)}
          />
        ))}
      </div>
      <ParticipantDetail
        participant={detail}
        rooms={rooms}
        teams={teams}
        options={options}
        onClose={() => setDetailId(null)}
        onChanged={() => mutate()}
        onUnbind={() => detail && onUnbind(detail)}
        onDeleted={(message) => {
          setDetailId(null);
          showToast(message);
          mutate();
        }}
      />
      <AddParticipant
        open={adding}
        options={options}
        note="신청서를 쓰지 않는 분들입니다. 체크인과 집계는 똑같이 됩니다."
        onClose={() => setAdding(false)}
        onAdded={(message) => {
          setAdding(false);
          showToast(message);
          mutate();
        }}
      />

      {scanning && (
        <QrScanner onResult={onScanResult} onClose={() => setScanning(false)} />
      )}
      <Toast toast={toast} />
    </>
  );
}
