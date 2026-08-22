"use client";

import { useActionState } from "react";
import { bindAction, type BindState } from "./actions";
import { EVENT } from "@/lib/content";

const initialState: BindState = { status: "idle" };

export default function BindForm() {
  const [state, formAction, pending] = useActionState(bindAction, initialState);
  const needPhone =
    state.status === "need_phone" || state.status === "phone_mismatch";

  return (
    <form action={formAction}>
      <label className="f-label" htmlFor="bind-name">
        NAME — 신청서에 적은 이름
      </label>
      <input
        id="bind-name"
        name="name"
        className="f-input"
        placeholder="김예찬"
        autoComplete="name"
        required
      />
      <label className="f-label" htmlFor="bind-birth">
        BIRTH — 8자리
      </label>
      <input
        id="bind-birth"
        name="birth"
        className="f-input"
        placeholder="19940101"
        inputMode="numeric"
        maxLength={8}
        required
      />
      {needPhone && (
        <>
          <label className="f-label" htmlFor="bind-phone4">
            PHONE — 뒷 4자리
          </label>
          <input
            id="bind-phone4"
            name="phone4"
            className="f-input"
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            autoFocus
          />
        </>
      )}
      {state.status !== "idle" && state.message && (
        <p className="msg err">{state.message}</p>
      )}
      {state.status === "not_found" && EVENT.applyUrl !== "#" && (
        <a
          className="btn ghost full"
          style={{ marginTop: 14 }}
          href={EVENT.applyUrl}
          target="_blank"
          rel="noreferrer"
        >
          참가 신청하러 가기
        </a>
      )}
      <button className="btn accent full" style={{ marginTop: 30 }} disabled={pending}>
        {pending ? "확인 중…" : "연결하기"}
      </button>
      <p className="note">
        다른 계정으로 로그인하려면 <SignOutLink />
      </p>
    </form>
  );
}

function SignOutLink() {
  return (
    <button
      type="button"
      style={{
        background: "none",
        border: "none",
        color: "inherit",
        fontSize: "inherit",
        padding: 0,
      }}
      onClick={async () => {
        await fetch("/auth/signout", { method: "POST" });
        location.href = "/";
      }}
    >
      로그아웃
    </button>
  );
}
