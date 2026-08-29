import type { Metadata, Viewport } from "next";
import "@/styles/base.css";

import ConfirmProvider from "@/components/Confirm";
import ServiceWorker from "@/components/ServiceWorker";

/**
 * 배포 도메인. 환경변수가 비어 있거나(Vercel에 값 없이 등록한 경우) 형식이
 * 잘못돼도 빌드가 죽지 않도록 방어한다 — `??`는 빈 문자열을 통과시킨다.
 */
function resolveSiteUrl(): URL {
  // 직접 지정한 값이 있으면 그것을, 없으면 Vercel이 자동으로 주는 프로덕션 도메인을 쓴다.
  // VERCEL_PROJECT_PRODUCTION_URL은 프리뷰 배포에서도 항상 프로덕션 주소를 가리켜
  // OG 이미지 링크를 만들기에 적합하다 (프로토콜은 포함되지 않는다).
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(value.startsWith("http") ? value : `https://${value}`);
    } catch {
      // 형식 오류 — 다음 후보로
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: "MIRACLE — 2026 GIL Community Conference",
  description:
    "2026 GIL Community Conference MIRACLE · 9.11(금)–13(주일) · ACTS29 비전 빌리지(양지 온누리교회)",
  /*
   * 검색 결과에 뜨지 않게 한다. robots.txt만으로는 부족하다 — 다른 곳에
   * 링크가 걸리면 크롤링 없이도 색인될 수 있어서, noindex를 문서에도 박는다.
   * 메신저 미리보기 봇은 색인기가 아니라 이 태그를 보지 않는다.
   */
  robots: { index: false, follow: false },
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
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Nanum+Gothic:wght@400;700;800&family=Nanum+Myeongjo:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="grain" aria-hidden="true" />
        <ConfirmProvider>{children}</ConfirmProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
