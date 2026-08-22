import LoginButton from "@/components/LoginButton";
import { LockIcon } from "@/components/icons";

export default function MyLocked() {
  return (
    <div className="locked reveal">
      <LockIcon strokeWidth={1.6} />
      <p>숙소·조·체크인 QR은 로그인 후 볼 수 있어요.</p>
      <LoginButton>로그인</LoginButton>
    </div>
  );
}
