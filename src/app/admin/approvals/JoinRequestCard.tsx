"use client";

import { useState } from "react";
import type { JoinRequest } from "@/lib/types";
import { fmtBirth, fmtDateTime, maskPhone } from "@/lib/format";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import { setParticipantStatus } from "../actions/approval";

/** 가입 요청 한 건 — 사칭 판별을 위해 소셜 프로필을 함께 보여준다 */
export default function JoinRequestCard({ request }: { request: JoinRequest }) {
  const [done, setDone] = useState<string | null>(null);
  const { pending, run } = useServerAction();
  const demo = useAdminDemo();

  const socialName = request.social_name ?? request.social_full_name;
  const avatar = request.social_avatar ?? request.social_picture;

  const act = (status: "approved" | "rejected") => {
    if (demo) {
      setDone("미리보기 모드 — 저장되지 않아요");
      return;
    }
    run(
      async () => {
        const res = await setParticipantStatus(request.id, status);
        setDone(res.ok ? (status === "approved" ? "승인됨" : "반려됨") : res.message);
      },
      status === "rejected"
        ? { confirm: `${request.name} 님의 요청을 반려할까요?` }
        : undefined
    );
  };

  return (
    <div className={`join-req${done ? " done" : ""}`}>
      <div className="jr-head">
        <div className="jr-who">
          {avatar ? (
            <img className="jr-avatar" src={avatar} alt="" />
          ) : (
            <div className="jr-avatar ph" aria-hidden="true" />
          )}
          <div>
            <b>{request.name}</b>
            <small>
              {fmtBirth(request.birth_date)} · {maskPhone(request.phone)}
            </small>
          </div>
        </div>
        <span className={`chip${request.matched ? " ok" : ""}`}>
          {request.matched ? "명단 일치" : "명단 외"}
        </span>
      </div>

      <dl className="jr-meta">
        <div>
          <dt>소셜 이름</dt>
          <dd>{socialName ?? "—"}</dd>
        </div>
        <div>
          <dt>로그인</dt>
          <dd>{request.bound_provider ?? "—"}</dd>
        </div>
        {request.social_email && (
          <div>
            <dt>이메일</dt>
            <dd>{request.social_email}</dd>
          </div>
        )}
        <div>
          <dt>요청 시각</dt>
          <dd>{request.requested_at ? fmtDateTime(request.requested_at) : "—"}</dd>
        </div>
      </dl>

      {done ? (
        <p className="jr-done">{done}</p>
      ) : (
        <div className="jr-acts">
          <button className="btn sm accent" disabled={pending} onClick={() => act("approved")}>
            {pending ? "처리 중…" : "승인"}
          </button>
          <button className="btn sm ghost" disabled={pending} onClick={() => act("rejected")}>
            반려
          </button>
        </div>
      )}
    </div>
  );
}
