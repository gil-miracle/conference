import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import { CameraIcon } from "@/components/icons";

export default function GalleryLocked({
  children,
  showLogin = false,
  showBind = false,
}: {
  children: React.ReactNode;
  showLogin?: boolean;
  showBind?: boolean;
}) {
  return (
    <div className="locked reveal">
      <CameraIcon />
      <p>{children}</p>
      {showLogin && <LoginButton>로그인</LoginButton>}
      {showBind && (
        <Link className="btn accent" href="/connect">
          신청 명단과 연결하기
        </Link>
      )}
    </div>
  );
}
