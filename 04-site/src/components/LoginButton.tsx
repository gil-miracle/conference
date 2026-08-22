"use client";

import { openLogin } from "@/lib/ui";

/** 로그인 시트를 여는 버튼 — 클래스만 바꿔 어디서든 재사용 */
export default function LoginButton({
  className = "btn",
  children = "로그인",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button className={className} type="button" onClick={() => openLogin()}>
      {children}
    </button>
  );
}
