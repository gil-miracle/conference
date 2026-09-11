"use client";

import { useEffect, useRef, useState } from "react";
import { byKind, groupKind } from "@/lib/format";
import { TSHIRT_SIZES } from "@/lib/participant-fields";
import type { SignupInfo } from "@/lib/types";

export const JOINED = "가입함";
export const CHECKED = "체크인함";

/** 괄호 안 안내를 뗀 짧은 이름 — "버스 (교회 출발)" → "버스" */
export const shortLabel = (v: string) => v.split("(")[0].trim() || v;

/**
 * 거르개가 보는 칸들. 참가자 명단은 다 갖고 있고, 숙소·조 화면은 가벼운
 * 목록이라 없는 칸이 있을 수 있다 — 없는 칸의 거르개는 「전체」처럼 군다.
 */
export type FilterablePerson = Pick<
  SignupInfo,
  "cell_group" | "inviter" | "applicant_type"
> &
  Partial<Pick<SignupInfo, "arrive_day" | "stay" | "tshirt" | "transport">> & {
    auth_user_id?: string | null;
    checked_in_at?: string | null;
    role?: string;
  };

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
export function MultiFilter({
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
                <button
                  type="button"
                  className="btn-plain"
                  onClick={() => onChange([])}
                >
                  전체 해제
                </button>
              )}
            </header>
            <div className="fill-list">
              {options.length === 0 && (
                <p className="hint-sm">고를 것이 없어요.</p>
              )}
              {options.map((o) => (
                <div
                  key={o}
                  className={`fill-row${value.includes(o) ? " on" : ""}`}
                >
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
              <button
                type="button"
                className="btn accent"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

/** 사이즈는 글자순이 아니다 — 아는 사이즈를 먼저 순서대로, 모르는 값은 뒤에 가나다순 */
const bySize = (a: string, b: string) => {
  const i = TSHIRT_SIZES.indexOf(a.toUpperCase());
  const j = TSHIRT_SIZES.indexOf(b.toUpperCase());
  if (i < 0 && j < 0) return a.localeCompare(b);
  if (i < 0) return 1;
  if (j < 0) return -1;
  return i - j;
};

/**
 * 참가자 거르개 — 구분·도착·숙박·티셔츠·교통편·가입·체크인(·관리자만).
 *
 * 참가자 명단과 숙소 배정이 같은 조건으로 거른다. 「금요일 자는 A 다락방」을
 * 명단에서 뽑아 보고 숙소 화면에서 다시 손으로 찾는 일이 없게, 거르개 한 벌을
 * 두 화면이 나눠 쓴다.
 *
 * `bar` 는 거르개 줄, `match` 는 한 사람이 조건에 드는가, `filtered` 는
 * 걸린 조건이 하나라도 있는가(초기화 단추를 낼지).
 */
export function useRosterFilter<T extends FilterablePerson>(
  people: T[] | undefined,
  { admin = false }: { admin?: boolean } = {},
) {
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

  const picked =
    cell.length +
    arrive.length +
    stay.length +
    tshirt.length +
    transport.length +
    joined.length +
    checked.length;
  const filtered = Boolean(picked || onlyAdmin);
  const clear = () => {
    setCell([]);
    setArrive([]);
    setStay([]);
    setJoined([]);
    setChecked([]);
    setTshirt([]);
    setTransport([]);
    setOnlyAdmin(false);
  };

  /* 고를 값은 명단에서 뽑는다 — 폼 선택지가 바뀌어도 따라간다 */
  const list = people ?? [];
  const uniq = (get: (p: T) => string | null | undefined) =>
    [...new Set(list.map(get).filter(Boolean))].sort() as string[];
  /* 목록 배지와 같은 판단을 쓴다 — 다락방이 없으면 "초청자"로 묶인다.
     초청자는 다락방 이름들 뒤에 둔다 */
  const cellOpts = [...new Set(list.map(groupKind))].sort(byKind);
  const arriveOpts = uniq((p) => p.arrive_day);
  /* 숙박일은 "9월 11일(금), 9월 12일(토)"처럼 여러 날이 한 칸에 들어온다.
     날짜 하나씩 고를 수 있어야 "금요일 자는 사람"을 뽑을 수 있다 */
  const stayOpts = [
    ...new Set(
      list.flatMap((p) =>
        (p.stay ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ),
  ].sort();
  /* 티셔츠는 사이즈별로 몇 장인지 세야 하고, 교통편은 버스 인원을 잡아야 한다 */
  const tshirtOpts = [...uniq((p) => p.tshirt)].sort(bySize);
  const transportOpts = uniq((p) => p.transport);

  const match = (p: T) => {
    if (cell.length && !cell.includes(groupKind(p))) return false;
    if (arrive.length && !arrive.includes(p.arrive_day ?? "")) return false;
    // 숙박일은 여러 날이 한 칸에 들어온다 — 고른 날 중 하나라도 들어 있으면 잡는다
    if (stay.length && !stay.some((d) => (p.stay ?? "").includes(d)))
      return false;
    if (tshirt.length && !tshirt.includes(p.tshirt ?? "")) return false;
    if (transport.length && !transport.includes(p.transport ?? ""))
      return false;
    // 하나만 골랐을 때만 거른다. 둘 다면 전체와 같다
    if (
      joined.length === 1 &&
      (joined[0] === JOINED) !== Boolean(p.auth_user_id)
    )
      return false;
    if (
      checked.length === 1 &&
      (checked[0] === CHECKED) !== Boolean(p.checked_in_at)
    )
      return false;
    if (onlyAdmin && p.role !== "admin") return false;
    return true;
  };

  const bar = (
    <div className="filters">
      <MultiFilter
        label="구분"
        options={cellOpts}
        value={cell}
        onChange={setCell}
      />
      <MultiFilter
        label="도착"
        options={arriveOpts}
        value={arrive}
        onChange={setArrive}
      />
      <MultiFilter
        label="숙박"
        options={stayOpts}
        value={stay}
        onChange={setStay}
      />
      <MultiFilter
        label="티셔츠"
        options={tshirtOpts}
        value={tshirt}
        onChange={setTshirt}
      />
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
      {admin && (
        /* 켜고 끄는 것 하나뿐이라 목록을 열 것이 없다 — 모양만 나란히 맞춘다 */
        <button
          type="button"
          className={`fpick fpick-toggle${onlyAdmin ? " on" : ""}`}
          aria-pressed={onlyAdmin}
          onClick={() => setOnlyAdmin(!onlyAdmin)}
        >
          관리자만
        </button>
      )}
    </div>
  );

  return { bar, match, filtered, clear };
}
