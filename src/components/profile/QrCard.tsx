import QRCode from "qrcode";
import CheckinWatch from "@/components/profile/CheckinWatch";
import QrZoom from "@/components/profile/QrZoom";
import { fmtDateTime } from "@/lib/format";

/**
 * 체크인 QR.
 * 체크인이 끝나면 QR을 감추고 완료 표시만 남긴다 —
 * 이미 쓴 코드를 계속 띄워둘 이유가 없고, 대리 스캔 여지도 줄인다.
 *
 * 완료 카드에는 티셔츠 크기를 함께 적는다. 등록 데스크에서 체크인과 티셔츠를
 * 같이 주는데, 크기를 참가자 화면에서 바로 보이면 데스크가 명단을 다시 찾지
 * 않아도 된다.
 */
export default async function QrCard({
  token,
  checkedInAt,
  tshirt,
}: {
  token: string;
  checkedInAt: string | null;
  /** 신청서의 티셔츠 크기 — 교역자·멘토·현장접수는 없을 수 있다 */
  tshirt?: string | null;
}) {
  if (checkedInAt) {
    return (
      <div className="my-card center">
        <div className="eyebrow">CHECK-IN</div>
        <h3>체크인 완료</h3>
        <span className="chip-in">✓ {fmtDateTime(checkedInAt)}</span>
        {tshirt && <span className="chip-in">티셔츠 {tshirt}</span>}
        <small className="block mt-10">잘 오셨어요. 즐거운 3일 되세요!</small>
      </div>
    );
  }

  const qrSvg = await QRCode.toString(token, {
    type: "svg",
    margin: 0,
    color: { dark: "#211D19", light: "#FFFFFF" },
  });

  return (
    <div className="my-card center">
      <div className="eyebrow">CHECK-IN QR</div>
      {/* 누르면 화면 가득 — 데스크 스캐너에는 카드 안의 크기가 작다 */}
      <QrZoom svg={qrSvg} />
      <small>체크인 데스크에서 이 화면을 보여주세요</small>
      {/* 찍히는 순간 이 카드가 완료 카드로 바뀌게 — 새로고침 없이 */}
      <CheckinWatch />
    </div>
  );
}
