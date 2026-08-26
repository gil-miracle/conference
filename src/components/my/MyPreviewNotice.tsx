import LoginButton from "@/components/LoginButton";

/**
 * 비로그인 방문자가 보는 My 미리보기 안내.
 * 아래 카드가 예시라는 걸 먼저 못박아야 한다 —
 * 실제 배정으로 오해하면 엉뚱한 방을 찾아간다.
 */
export default function MyPreviewNotice() {
  return (
    <div className="my-preview reveal">
      <div className="eyebrow">PREVIEW</div>
      <p>
        아래는 <b>예시 화면</b>이에요. 로그인하고 신청 명단과 연결하면
        내 숙소·조·체크인 QR이 여기에 나옵니다.
      </p>
      <LoginButton className="btn accent">로그인하고 내 정보 보기</LoginButton>
    </div>
  );
}
