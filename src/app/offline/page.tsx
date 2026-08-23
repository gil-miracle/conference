import "@/styles/site.css";

import Link from "next/link";

export const metadata = { title: "오프라인 — MIRACLE 2026" };

export default function OfflinePage() {
  return (
    <div className="bind-wrap" style={{ textAlign: "center" }}>
      <div className="eyebrow">OFFLINE</div>
      <h2>지금은 연결이 끊겼어요</h2>
      <p className="sub">
        인터넷이 다시 연결되면 자동으로 볼 수 있어요.
        <br />
        비전 빌리지 안에서는 신호가 약한 곳이 있을 수 있습니다.
      </p>
      <Link className="btn accent full" href="/" style={{ marginTop: 30 }}>
        다시 시도
      </Link>
    </div>
  );
}
