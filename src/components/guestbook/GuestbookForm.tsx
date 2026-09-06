"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { GUESTBOOK_MAX } from "@/lib/guestbook";
import {
  addGuestbookEntry,
  type GuestbookState,
} from "@/app/actions/guestbook";

const initialState: GuestbookState = { status: "idle" };

export default function GuestbookForm() {
  const [openForm, setOpenForm] = useState(false);
  /* 「남겼어요」는 확인용이다. 화면을 다시 열면 사라지고, 그 전에도 ✕로
     닫을 수 있다 — 저 혼자 계속 붙어 있지는 않는다 */
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(GUESTBOOK_MAX);
  const [state, formAction, pending] = useActionState(
    addGuestbookEntry,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 등록 성공 시 내용 비우고 접기
  useEffect(() => {
    if (state.status !== "ok") return;
    formRef.current?.reset();
    setLeft(GUESTBOOK_MAX);
    setOpenForm(false);
    setDone(true);
    // 저절로 사라지지는 않는다 — 읽는 속도는 사람마다 다르고, 닫는 ✕가
    // 있으니 언제 치울지는 보는 사람이 정하면 된다
  }, [state]);

  if (!openForm) {
    return (
      <>
        <button className="gb-write" onClick={() => setOpenForm(true)}>
          한 줄 노트 남기기
        </button>
        {done && (
          <p className="msg ok gb-done" role="status">
            {state.message}
            <button type="button" aria-label="닫기" onClick={() => setDone(false)}>
              ✕
            </button>
          </p>
        )}
      </>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="gb-form">
      {/* 이름 칸은 없다 — 로그인해야 쓸 수 있어 작성자는 이미 정해져 있다 */}
      <label className="f-label" htmlFor="gb-content">
        MESSAGE
      </label>
      <textarea
        id="gb-content"
        name="content"
        className="f-input"
        maxLength={GUESTBOOK_MAX}
        placeholder="함께 나누고 싶은 기대, 기도, 인사를 남겨주세요."
        onChange={(e) => setLeft(GUESTBOOK_MAX - e.target.value.length)}
        required
      />
      {/* 다 쓰고 나서 잘리는 걸 알면 늦다 — 남은 글자를 계속 보여준다 */}
      <p className={`f-count${left <= 20 ? " near" : ""}`}>
        {left}자 남음
      </p>
      {state.status === "error" && <p className="msg err">{state.message}</p>}
      <div className="btn-row mt-22">
        <button className="btn accent" disabled={pending}>
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
