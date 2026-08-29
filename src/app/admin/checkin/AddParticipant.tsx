"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminDemo } from "../AdminMode";
import { createParticipant, type ParticipantInput } from "../actions/participant";
import ParticipantForm, { emptyParticipant } from "./ParticipantForm";

/**
 * 명단에 사람 추가.
 *
 * 교역자·멘토는 신청서를 쓰지 않아 시트에 없다. 시트에 대신 적어 넣는 방법도
 * 있지만 그건 신청자 응답을 손대는 일이라, 우리 쪽 명단에서 넣는다.
 */
export default function AddParticipant({
  open,
  options,
  staffOnly = true,
  note,
  onClose,
  onAdded,
}: {
  open: boolean;
  options: Record<string, string[]>;
  /** 명단 탭은 교역자·멘토만, 숙소 탭은 누구든 */
  staffOnly?: boolean;
  note?: string;
  onClose: () => void;
  onAdded: (message: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const demo = useAdminDemo();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    setMsg(null);
  }, [open]);

  const submit = async (value: ParticipantInput) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await createParticipant(value);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    onAdded(res.message);
  };

  return (
    <dialog
      ref={ref}
      className="pdetail"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="pdetail-in">
          <header>
            <b>참가자 추가</b>
          </header>
          {/* key로 다시 열 때마다 폼을 새로 만든다 — 지난번에 치던 값이 남으면
              엉뚱한 사람이 들어간다 */}
          <ParticipantForm
            key={String(open)}
            initial={emptyParticipant()}
            options={options}
            busy={busy}
            submitLabel="추가"
            staffOnly={staffOnly}
            onSubmit={submit}
            onCancel={onClose}
          />
          {msg && <p className="msg mt-12">{msg}</p>}
          {note && <small className="pdetail-note">{note}</small>}
        </div>
      )}
    </dialog>
  );
}
