"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addGuestbookEntry,
  type GuestbookState,
} from "@/app/actions/guestbook";

const initialState: GuestbookState = { status: "idle" };

export default function GuestbookForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [openForm, setOpenForm] = useState(false);
  const [state, formAction, pending] = useActionState(
    addGuestbookEntry,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 등록 성공 시 내용 비우고 접기
  useEffect(() => {
    if (state.status === "ok") {
      formRef.current?.reset();
      setOpenForm(false);
    }
  }, [state]);

  if (!openForm) {
    return (
      <>
        <button className="gb-write" onClick={() => setOpenForm(true)}>
          방명록 남기기
        </button>
        {state.status === "ok" && <p className="msg ok">{state.message}</p>}
      </>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="gb-form">
      <label className="f-label" htmlFor="gb-name">
        NAME — 실명 또는 닉네임
      </label>
      <input
        id="gb-name"
        name="display_name"
        className="f-input"
        defaultValue={defaultName}
        maxLength={20}
        required
      />
      <label className="f-label" htmlFor="gb-content">
        MESSAGE
      </label>
      <textarea
        id="gb-content"
        name="content"
        className="f-input"
        maxLength={500}
        placeholder="함께 나누고 싶은 기대, 기도, 인사를 남겨주세요."
        required
      />
      {state.status === "error" && <p className="msg err">{state.message}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        <button className="btn accent" style={{ flex: 1 }} disabled={pending}>
          {pending ? "등록 중…" : "등록하기"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => setOpenForm(false)}
        >
          취소
        </button>
      </div>
    </form>
  );
}
