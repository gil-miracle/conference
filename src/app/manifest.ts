import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MIRACLE — 2026 GIL Community Conference",
    short_name: "MIRACLE",
    description:
      "2026 GIL Community Conference MIRACLE · 9.11(금)–13(주일) · ACTS29 비전 빌리지",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF6EE",
    theme_color: "#FAF6EE",
    lang: "ko",
    categories: ["events", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable도 같은 그림이다. MIRACLE 글자가 안전 원(지름 80%) 안에
      // 들어와 있어 안드로이드가 원·스퀴클로 잘라도 안 잘린다 — 여백 띠를
      // 두른 판을 따로 둘 이유가 없다
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "체크인 QR", short_name: "내 정보", url: "/profile" },
      { name: "일정표", short_name: "일정표", url: "/timetable" },
      { name: "찬양", short_name: "찬양", url: "/songs" },
    ],
  };
}
