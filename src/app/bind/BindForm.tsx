"use client";

import { useActionState, useState } from "react";
import { EVENT } from "@/lib/content";
import {
  lookupAction,
  requestAction,
  type LookupResult,
  type RequestResult,
} from "./actions";

/**
 * 가입 절차 2단계
 *   ① 이름·생년월일·전화번호로 신청 명단 조회 — 없으면 여기서 끝
 *   ② 본인이 맞는지 확인받고 가입 요청 전송 → 관리자 승인 대기
 */
export default function BindForm({ defaultName }: { defaultName: string }) {
  const [lookup, lookupFormAction, looking] = useActionState<
    LookupResult | null,
    FormData
  >(lookupAction, null);
  const [request, requestFormAction, requesting] = useActionState<
    RequestResult | null,
    FormData
  >(requestAction, null);

  const [name, setName] = useState(defaultName);
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");

  // 조회에 성공하면 확인 화면으로 넘어간다
  if (lookup?.kind === "found") {
    return (
      <form action={requestFormAction}>
        <input type="hidden" name="name" value={lookup.name} />
        <input type="hidden" name="birth" value={lookup.birth.replaceAll("-", "")} />
        <input type="hidden" name="phone" value={lookup.phone} />

        <div className="confirm-card">
          <div className="eyebrow">신청 내역 확인</div>
          <h3>{lookup.name} 님</h3>
          <p>
            신청 명단에서 확인했어요.
            <br />
            본인이 맞다면 가입 요청을 보내주세요.
          </p>
          <small>요청 후 운영진 승인을 거치면 숙소·조·체크인 QR을 볼 수 있어요.</small>
        </div>

        {request?.kind === "error" && <p className="msg err">{request.message}</p>}

        <button className="btn accent full mt-22" disabled={requesting}>
          {requesting ? "보내는 중…" : "가입 요청 보내기"}
        </button>
        <p className="note">
          내 정보가 아니라면 보내지 마세요. 잘못 연결되면 본인이 가입할 수 없게 됩니다.
        </p>
      </form>
    );
  }

  return (
    <form action={lookupFormAction}>
      <label className="f-label" htmlFor="bind-name">
        NAME — 신청서에 적은 이름
      </label>
      <input
        id="bind-name"
        name="name"
        className="f-input"
        placeholder="김예찬"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
        value={birth}
        onChange={(e) => setBirth(e.target.value.replace(/\D/g, ""))}
        required
      />

      <label className="f-label" htmlFor="bind-phone">
        PHONE — 신청서에 적은 번호
      </label>
      <input
        id="bind-phone"
        name="phone"
        className="f-input"
        placeholder="01012345678"
        inputMode="numeric"
        maxLength={13}
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, ""))}
        required
      />

      {lookup?.kind === "error" && <p className="msg err">{lookup.message}</p>}
      {lookup?.kind === "error" && lookup.showApply && EVENT.applyUrl !== "#" && (
        <a
          className="btn ghost full mt-14"
          href={EVENT.applyUrl}
          target="_blank"
          rel="noreferrer"
        >
          참가 신청하러 가기
        </a>
      )}

      <button className="btn accent full mt-30" disabled={looking}>
        {looking ? "확인 중…" : "신청 내역 확인"}
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
      className="btn-plain underline"
      onClick={async () => {
        await fetch("/auth/signout", { method: "POST" });
        location.href = "/";
      }}
    >
      로그아웃
    </button>
  );
}
