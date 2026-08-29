"use client";

import { useId, useState } from "react";
import { SIGNUP_FIELDS } from "@/lib/participant-fields";
import type { ParticipantInput } from "../actions/participant";

export const emptyParticipant = (): ParticipantInput => ({
  name: "",
  birth_date: "",
  phone: "",
  applicant_type: null,
  cell_group: null,
  inviter: null,
  transport: null,
  arrive_day: null,
  arrive_time: null,
  stay: null,
  tshirt: null,
});

/**
 * 참가자 한 명의 신청 정보를 넣고 고치는 폼.
 *
 * 추가와 수정이 같은 값을 다루므로 폼도 하나만 둔다.
 *
 * 신청 항목은 자유 문구다. 선택지를 고정하면 신청 폼 문구가 바뀔 때 못 고르는
 * 값이 생기므로, 이미 명단에 쓰인 값을 후보(datalist)로만 보여주고 입력은
 * 열어둔다 — 손으로 넣은 교역자도 같은 문구를 쓰게 된다.
 */
export default function ParticipantForm({
  initial,
  options,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ParticipantInput;
  options: Record<string, string[]>;
  busy: boolean;
  submitLabel: string;
  onSubmit: (value: ParticipantInput) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const uid = useId();
  const set = (k: keyof ParticipantInput, value: string) =>
    setV((prev) => ({ ...prev, [k]: value }));

  return (
    <form
      className="pform"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
    >
      <label>
        <span>이름</span>
        <input
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={20}
          required
        />
      </label>
      <label>
        <span>생년월일</span>
        <input
          type="date"
          value={v.birth_date}
          onChange={(e) => set("birth_date", e.target.value)}
          required
        />
      </label>
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
      {SIGNUP_FIELDS.map((f) => (
        <label key={f.key}>
          <span>{f.label}</span>
          <input
            list={`${uid}-${f.key}`}
            value={v[f.key] ?? ""}
            onChange={(e) => set(f.key, e.target.value)}
          />
          <datalist id={`${uid}-${f.key}`}>
            {(options[f.key] ?? []).map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>
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
