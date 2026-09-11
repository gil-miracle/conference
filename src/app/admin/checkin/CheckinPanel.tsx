"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { jsonFetcher } from "@/lib/fetcher";
import { byKind, groupKind } from "@/lib/format";
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

/** 티셔츠 사이즈 차례. 여기 없는 값은 뒤로 밀린다 */
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"];

/**
 * 괄호 안 안내를 뗀 짧은 이름.
 *
 * '공동체 버스(9/11(금) 오후 7시30분, 혜화 이룸에서 출발 예정)'가 통째로
 * 셀렉트에 들어가면 목록이 화면을 넘는다. 고를 때 필요한 건 앞의 낱말뿐이다.
 * 거르는 값은 원래 값 그대로라 명단과 어긋나지 않는다.
 */
const shortLabel = (v: string) => v.split("(")[0].trim() || v;

/* 고른 값이 곧 화면에 적히는 말이다 — 코드와 글이 갈라지지 않게 한 곳에 둔다 */
const JOINED = "가입함";
const CHECKED = "체크인함";

/**
 * 여러 개를 고르는 거르개.
 *
 * `<select multiple>`은 폰에서 쓸 것이 못 된다. 조각(chip)으로 세워 봤더니
 * 이번에는 고른 것이 늘수록 거르개 줄이 두세 줄로 밀려, 정작 다음 거르개를
 * 찾기 어려웠다.
 *
 * 숙소 배정과 같은 모양으로 바꾼다 — 단추 하나가 「몇 개 골랐는지」만 말하고,
 * 누르면 체크 목록이 열린다. 줄 길이가 고른 개수와 상관없이 늘 같다.
 */
function MultiFilter({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  format?: (v: string) => string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const show = (v: string) => (format ? format(v) : v);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <>
      <button
        type="button"
        className={`fpick${value.length ? " on" : ""}`}
        onClick={() => setOpen(true)}
      >
        {label} {value.length ? `· ${value.length}개` : "전체"}
      </button>

      <dialog
        ref={ref}
        className="pdetail"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
      >
        {open && (
          <div className="pdetail-in">
            <header>
              <b>{label}</b>
              {value.length > 0 && (
                <button type="button" className="btn-plain" onClick={() => onChange([])}>
                  전체 해제
                </button>
              )}
            </header>
            <div className="fill-list">
              {options.length === 0 && <p className="hint-sm">고를 것이 없어요.</p>}
              {options.map((o) => (
                <div key={o} className={`fill-row${value.includes(o) ? " on" : ""}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={value.includes(o)}
                      onChange={() => toggle(o)}
                    />
                    <span>{show(o)}</span>
                  </label>
                </div>
              ))}
            </div>
            <div className="pform-actions">
              <button type="button" className="btn accent" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

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
  /* 여러 개를 한꺼번에 고른다 — 데스크에서 「A·B 다락방만」, 「L·XL만」처럼
     묶어 뽑는 일이 잦은데, 하나씩만 고를 수 있으면 세 번 훑어야 했다 */
  const [cell, setCell] = useState<string[]>([]);
  const [arrive, setArrive] = useState<string[]>([]);
  const [stay, setStay] = useState<string[]>([]);
  /* 있음/없음 둘 다 필요해서 토글로 두지 않는다. 다른 거르개와 같은 모양으로
     맞추려고 여기도 여러 개 고르기다 — 둘 다 고르면 거른 것이 없는 셈이라
     「전체」와 같아진다 */
  const [joined, setJoined] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [tshirt, setTshirt] = useState<string[]>([]);
  const [transport, setTransport] = useState<string[]>([]);
  const [onlyAdmin, setOnlyAdmin] = useState(false);

  /* 걸어 둔 것이 하나라도 있으면 초기화를 낸다 — 다섯 개를 하나씩
     되돌리다 보면 어느 것이 남았는지 모른다 */
  const picked =
    cell.length +
    arrive.length +
    stay.length +
    tshirt.length +
    transport.length +
    joined.length +
    checked.length;
  const filtered = Boolean(picked || onlyAdmin);
  const clearFilters = () => {
    setCell([]);
    setArrive([]);
    setStay([]);
    setJoined([]);
    setChecked([]);
    setTshirt([]);
    setTransport([]);
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
      if (result.status === "ok") showToast(`✓ ${result.name} 체크인 완료`);
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
  /* 사이즈는 글자순이 아니다 — 그냥 정렬하면 4XL이 L보다 앞에 선다.
     아는 사이즈를 먼저 순서대로, 모르는 값은 뒤에 가나다순으로 */
  const bySize = (a: string, b: string) => {
    const i = SIZES.indexOf(a.toUpperCase());
    const j = SIZES.indexOf(b.toUpperCase());
    if (i < 0 && j < 0) return a.localeCompare(b);
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  };
  const uniq = (get: (p: AdminParticipant) => string | null) =>
    [...new Set((data ?? []).map(get).filter(Boolean))].sort() as string[];
  /* 목록 배지와 같은 판단을 쓴다 — 다락방이 없으면 "초청자"로 묶인다.
     초청자는 다락방 이름들 뒤에 둔다 */
  const cellOpts = [...new Set((data ?? []).map(groupKind))].sort(byKind);
  const arriveOpts = uniq((p) => p.arrive_day);
  /* 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다.
     날짜 하나씩 고를 수 있어야 "금요일 자는 사람"을 뽑을 수 있다 */
  const stayOpts = [
    ...new Set(
      (data ?? []).flatMap((p) =>
        (p.stay ?? "").split(",").map((x) => x.trim()).filter(Boolean)
      )
    ),
  ].sort();
  /* 티셔츠는 사이즈별로 몇 장인지 세야 하고, 교통편은 버스 인원을 잡아야 한다 */
  const tshirtOpts = [...uniq((p) => p.tshirt)].sort(bySize);
  const transportOpts = uniq((p) => p.transport);

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
    if (cell.length && !cell.includes(groupKind(p))) return false;
    if (arrive.length && !arrive.includes(p.arrive_day ?? "")) return false;
    // 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다 —
    // 고른 날 중 하나라도 들어 있으면 잡는다
    if (stay.length && !stay.some((d) => (p.stay ?? "").includes(d))) return false;
    if (tshirt.length && !tshirt.includes(p.tshirt ?? "")) return false;
    if (transport.length && !transport.includes(p.transport ?? "")) return false;
    // 하나만 골랐을 때만 거른다. 둘 다면 전체와 같다
    if (joined.length === 1 && (joined[0] === JOINED) !== Boolean(p.auth_user_id))
      return false;
    if (checked.length === 1 && (checked[0] === CHECKED) !== Boolean(p.checked_in_at))
      return false;
    if (onlyAdmin && p.role !== "admin") return false;
    return true;
  });

  /*
   * 지체 · 교역자 · 멘토 셋으로 나눈다.
   *
   * 다락방 이름으로 나눴더니 한두 줄짜리 칸이 열몇 개 생겨 되레 훑기 어려웠다.
   * 데스크에서 보는 큰 갈래는 「우리 지체인가, 섬기러 오신 분인가」다 —
   * 다락방은 줄마다 붙는 배지에 남는다.
   */
  const sections = (() => {
    const by = new Map<string, AdminParticipant[]>();
    for (const p of shown) {
      const key = groupKind(p);
      const list = by.get(key);
      if (list) list.push(p);
      else by.set(key, [p]);
    }
    return [...by.entries()].sort((a, b) => byKind(a[0], b[0]));
  })();

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
        <MultiFilter label="구분" options={cellOpts} value={cell} onChange={setCell} />
        <MultiFilter label="도착" options={arriveOpts} value={arrive} onChange={setArrive} />
        <MultiFilter label="숙박" options={stayOpts} value={stay} onChange={setStay} />
        <MultiFilter label="티셔츠" options={tshirtOpts} value={tshirt} onChange={setTshirt} />
        <MultiFilter
          label="교통편"
          options={transportOpts}
          value={transport}
          onChange={setTransport}
          format={shortLabel}
        />
        <MultiFilter
          label="가입"
          options={[JOINED, "미가입"]}
          value={joined}
          onChange={setJoined}
        />
        <MultiFilter
          label="체크인"
          options={[CHECKED, "미체크인"]}
          value={checked}
          onChange={setChecked}
        />
        {/* 켜고 끄는 것 하나뿐이라 목록을 열 것이 없다 — 모양만 나란히 맞춘다 */}
        <button
          type="button"
          className={`fpick fpick-toggle${onlyAdmin ? " on" : ""}`}
          aria-pressed={onlyAdmin}
          onClick={() => setOnlyAdmin(!onlyAdmin)}
        >
          관리자만
        </button>
      </div>

      {/* 거르개가 아닌 것들 — 줄을 나눠야 위 칸들이 나란히 선다 */}
      <div className="filters-foot">
        {/* 걸린 것이 없으면 아예 없다. 흐리게 두면 눌리지도 않는 것이 호버에
            반응해 테두리만 생긴다 — 있는 것도 없는 것도 아닌 꼴이 된다 */}
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
                {q || filtered
                  ? "조건에 맞는 사람이 없어요."
                  : "참가자 명단이 비어 있어요 — 설정 탭에서 동기화하세요."}
              </small>
            </div>
          </div>
        )}
        {sections.map(([name, list]) => (
          <div key={name} className="pgroup">
            <div className="pgroup-head">
              <b>{name}</b>
              <span>
                {list.filter((p) => p.checked_in_at).length} / {list.length}
              </span>
            </div>
            {list.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                onToggleCheckin={() => onToggleCheckin(participant)}
                onOpen={() => setDetailId(participant.id)}
              />
            ))}
          </div>
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
