"use client";

import { useState } from "react";
import {
  SIGNUP_FIELDS,
  STAFF_HIDDEN,
  STAFF_TYPES,
  isStaff,
} from "@/lib/participant-fields";
import type { SignupInfo } from "@/lib/types";
import type { ParticipantInput } from "../actions/participant";

export const emptyParticipant = (): ParticipantInput => ({
  name: "",
  birth_date: "",
  phone: "",
  applicant_type: null,
  gender: null,
  cell_group: null,
  inviter: null,
  transport: null,
  arrive_day: null,
  arrive_time: null,
  stay: null,
  tshirt: null,
});

/** 목록에 없는 값을 직접 치겠다는 선택지 — 실제 값과 겹치지 않는 표식 */
const CUSTOM = "__custom__";

/**
 * 목록에서 고르되, 없으면 직접 친다.
 *
 * 신청 항목은 자유 문구라 선택지를 코드에 박을 수 없다 — 신청 폼 문구가 한 번
 * 바뀌면 못 고르는 값이 생긴다. 그래서 이미 명단에 쓰인 값을 선택지로 세우고
 * 「직접 입력」을 마지막에 둔다. 평소에는 고르기만 하면 되고, 처음 보는 값도
 * 막히지 않는다.
 */
function ChoiceField({
  label,
  value,
  options,
  allowCustom = true,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  /** 고를 값이 둘뿐이면 직접 칠 자리가 없다 */
  allowCustom?: boolean;
  onChange: (next: string) => void;
}) {
  // 시트에서 온 값이 후보에 없을 수 있다 — 그대로 보여야 실수로 지워지지 않는다
  const list = [...new Set(value ? [...options, value] : options)].sort();
  const [typing, setTyping] = useState(false);

  return (
    <label>
      <span>{label}</span>
      <div className="pf-choice">
        <select
          value={typing ? CUSTOM : value ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            setTyping(next === CUSTOM);
            onChange(next === CUSTOM ? "" : next);
          }}
        >
          <option value="">없음</option>
          {list.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {allowCustom && <option value={CUSTOM}>직접 입력…</option>}
        </select>
        {typing && (
          <input
            value={value ?? ""}
            placeholder="직접 입력"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </label>
  );
}

/**
 * 참가자 한 명의 신청 정보를 넣고 고치는 폼.
 *
 * 추가와 수정이 같은 값을 다루므로 폼도 하나만 둔다.
 *
 * `staffOnly`는 추가 화면용이다. 참가자를 새로 넣는 일은 교역자·멘토뿐이라
 * (나머지는 신청서를 쓰고 시트로 들어온다) 유형을 그 둘로만 좁힌다.
 */
export default function ParticipantForm({
  initial,
  options,
  busy,
  submitLabel,
  staffOnly = false,
  onSubmit,
  onCancel,
}: {
  initial: ParticipantInput;
  options: Record<string, string[]>;
  busy: boolean;
  submitLabel: string;
  staffOnly?: boolean;
  onSubmit: (value: ParticipantInput) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const set = (k: keyof ParticipantInput, value: string) =>
    setV((prev) => ({ ...prev, [k]: value }));

  const staff = staffOnly || isStaff(v.applicant_type);
  /*
   * 추가 화면은 교역자·멘토 전용이라 쓸 게 세 칸뿐이다 — 유형·이름·전화번호.
   * 오는 방법·도착 시간·티셔츠는 신청서 문항이라 그분들께는 묻지 않는다.
   * 생년월일도 마찬가지다 — 받으려면 따로 여줘야 한다.
   */
  const leadField = staffOnly
    ? SIGNUP_FIELDS.find((f) => f.key === "applicant_type")
    : null;
  const fields = staffOnly
    ? []
    : SIGNUP_FIELDS.filter((f) => !(staff && STAFF_HIDDEN.includes(f.key)));

  /** 유형만은 코드가 아는 값이 있다 — 교역자·멘토는 시트에서 오지 않는다 */
  const choicesFor = (key: keyof SignupInfo) =>
    key !== "applicant_type"
      ? options[key] ?? []
      : staffOnly
        ? STAFF_TYPES
        : [...new Set([...(options[key] ?? []), ...STAFF_TYPES])];

  const submit = () => {
    const value = { ...v };
    // 숨긴 칸에 옛 값이 남아 있으면 배지·필터가 그 값을 계속 따른다
    if (staff) for (const k of STAFF_HIDDEN) value[k] = null;
    onSubmit(value);
  };

  return (
    <form
      className="pform"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {leadField && (
        <ChoiceField
          label={leadField.label}
          value={v[leadField.key]}
          options={choicesFor(leadField.key)}
          allowCustom={false}
          onChange={(next) => set(leadField.key, next)}
        />
      )}
      <label>
        <span>이름</span>
        <input
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={20}
          required
        />
      </label>
      {/* 교역자·멘토는 생년월일이 없다. 고칠 땐 칸을 남기되 강요하지 않는다 */}
      {!staffOnly && (
        <label>
          <span>생년월일</span>
          <input
            type="date"
            value={v.birth_date}
            onChange={(e) => set("birth_date", e.target.value)}
            required={!staff}
          />
        </label>
      )}
      <label>
        <span>전화번호</span>
        <input
          type="tel"
          inputMode="tel"
          placeholder="010-1234-5678"
          value={v.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </label>
      {fields.map((f) => (
        <ChoiceField
          key={f.key}
          label={f.label}
          value={v[f.key]}
          options={choicesFor(f.key)}
          onChange={(next) => set(f.key, next)}
        />
      ))}
      <div className="pform-actions">
        <button type="button" className="btn ghost" disabled={busy} onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn accent" disabled={busy}>
          {busy ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
