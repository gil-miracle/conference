import type { Metadata, Viewport } from "next";
import "@/styles/base.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "MIRACLE — 2026 GIL Community Conference",
  description:
    "2026 GIL Community Conference MIRACLE · 9.11(금)–13(주일) · ACTS29 비전 빌리지(양지 온누리교회)",
  openGraph: {
    title: "MIRACLE — 2026 GIL Community Conference",
    description: "9.11(금)–13(주일) · ACTS29 비전 빌리지",
    images: ["/poster.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6EE",
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
      </body>
    </html>
  );
}
