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
    /*
     * ?v=2 — 파일 이름은 그대로 두고 그림만 갈았다. 크롬은 하루에 한 번쯤
     * 매니페스트를 다시 읽어 홈 화면 아이콘을 갱신하는데, 주소가 그대로면
     * 안 바뀐 것으로 볼 여지가 있다. 주소를 바꿔 확실히 다시 받게 한다.
     * (아이폰은 어차피 설치 때 구운 아이콘을 안 바꾼다 — 지우고 다시 담아야)
     */
    icons: [
      { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable도 같은 그림이다. MIRACLE 글자가 안전 원(지름 80%) 안에
      // 들어와 있어 안드로이드가 원·스퀴클로 잘라도 안 잘린다 — 여백 띠를
      // 두른 판을 따로 둘 이유가 없다
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "체크인 QR", short_name: "내 정보", url: "/profile" },
      { name: "일정표", short_name: "일정표", url: "/timetable" },
      { name: "찬양", short_name: "찬양", url: "/songs" },
    ],
  };
}
