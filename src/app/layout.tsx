import type { Metadata, Viewport } from "next";
import "@/styles/base.css";

import ServiceWorker from "@/components/ServiceWorker";

/**
 * 배포 도메인. 환경변수가 비어 있거나(Vercel에 값 없이 등록한 경우) 형식이
 * 잘못돼도 빌드가 죽지 않도록 방어한다 — `??`는 빈 문자열을 통과시킨다.
 */
function resolveSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    } catch {
      // 형식 오류 — 아래 기본값으로 폴백
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: "MIRACLE — 2026 GIL Community Conference",
  description:
    "2026 GIL Community Conference MIRACLE · 9.11(금)–13(주일) · ACTS29 비전 빌리지(양지 온누리교회)",
  appleWebApp: {
    capable: true,
    title: "MIRACLE",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "MIRACLE — 2026 GIL Community Conference",
    description: "9.11(금)–13(주일) · ACTS29 비전 빌리지",
    images: ["/poster.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6EE",
  width: "device-width",
  initialScale: 1,
  // 홈 화면에 추가했을 때 노치 영역까지 배경이 이어지도록
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Nanum+Myeongjo:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
