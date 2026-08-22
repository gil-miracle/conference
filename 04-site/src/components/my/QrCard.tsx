import QRCode from "qrcode";
import { fmtDateTime } from "@/lib/format";

/** 체크인 QR — checkin_token을 서버에서 SVG로 렌더 */
export default async function QrCard({
  token,
  checkedInAt,
}: {
  token: string;
  checkedInAt: string | null;
}) {
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
      {checkedInAt ? (
        <>
          <small>체크인 완료</small>
          <br />
          <span className="chip-in">✓ CHECKED IN {fmtDateTime(checkedInAt)}</span>
        </>
      ) : (
        <small>체크인 데스크에서 이 화면을 보여주세요</small>
      )}
    </div>
  );
}
