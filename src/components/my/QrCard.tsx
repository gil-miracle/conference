import QRCode from "qrcode";
import { fmtDateTime } from "@/lib/format";

/**
 * 체크인 QR.
 * 체크인이 끝나면 QR을 감추고 완료 표시만 남긴다 —
 * 이미 쓴 코드를 계속 띄워둘 이유가 없고, 대리 스캔 여지도 줄인다.
 */
export default async function QrCard({
  token,
  checkedInAt,
}: {
  token: string;
  checkedInAt: string | null;
}) {
  if (checkedInAt) {
    return (
      <div className="my-card" style={{ textAlign: "center" }}>
        <div className="eyebrow">CHECK-IN</div>
        <h3>체크인 완료</h3>
        <span className="chip-in">✓ {fmtDateTime(checkedInAt)}</span>
        <small style={{ display: "block", marginTop: 10 }}>
          잘 오셨어요. 즐거운 3일 되세요!
        </small>
      </div>
    );
  }

  const qrSvg = await QRCode.toString(token, {
    type: "svg",
    margin: 0,
    color: { dark: "#211D19", light: "#FFFFFF" },
  });

  return (
    <div className="my-card" style={{ textAlign: "center" }}>
      <div className="eyebrow">CHECK-IN QR</div>
      <div
        className="qr"
        // qrcode 라이브러리가 만든 신뢰 가능한 SVG 문자열
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <small>체크인 데스크에서 이 화면을 보여주세요</small>
    </div>
  );
}
