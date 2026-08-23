import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import GuestbookForm from "./GuestbookForm";

/** 작성 영역 — 상태(닫힘/비로그인/미바인딩/작성 가능)에 따라 CTA 분기 */
export default function GuestbookWriteCta({
  open,
  authed,
  bound,
  myName,
}: {
  open: boolean;
  authed: boolean;
  bound: boolean;
  myName: string | null;
}) {
  if (!open)
    return (
      <button className="gb-write" disabled style={{ opacity: 0.5 }}>
        지금은 방명록 작성이 닫혀 있어요
      </button>
    );

  if (!authed)
    return (
      <LoginButton className="gb-write">
        방명록 남기기 — 로그인 후 작성할 수 있어요
      </LoginButton>
    );

  if (!bound)
    return (
      <Link
        className="gb-write"
        href="/bind"
        style={{ display: "block", textAlign: "center" }}
      >
        방명록 남기기 — 신청 명단 연결 후 작성할 수 있어요
      </Link>
    );

  return <GuestbookForm defaultName={myName ?? ""} />;
}
