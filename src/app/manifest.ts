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
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "체크인 QR", short_name: "내 정보", url: "/profile" },
      { name: "일정표", short_name: "일정표", url: "/timetable" },
      { name: "찬양리스트", short_name: "찬양", url: "/songs" },
    ],
  };
}
