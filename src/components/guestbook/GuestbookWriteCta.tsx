"use client";

import Link from "next/link";
import { openLogin } from "@/lib/ui";
import { useSession } from "@/components/SessionProvider";
import GuestbookForm from "./GuestbookForm";

/** 작성 영역 — 세션 상태에 따라 CTA 분기 (클라이언트에서 판단해 페이지는 정적 유지) */
export default function GuestbookWriteCta() {
  const { session, loaded } = useSession();

  if (!loaded) {
    return (
      <button className="gb-write" disabled>
        불러오는 중…
      </button>
    );
  }

  if (!session.authed)
    return (
      <button className="gb-write" onClick={() => openLogin()}>
        한 줄 노트 남기기 — 로그인 후 작성할 수 있어요
      </button>
    );

  if (!session.bound)
    return (
      <Link className="gb-write block center" href="/connect">
        한 줄 노트 남기기 — 신청 명단 연결 후 작성할 수 있어요
      </Link>
    );

  return <GuestbookForm />;
}
