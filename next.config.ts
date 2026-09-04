import type { NextConfig } from "next";

/**
 * 보안 헤더.
 *
 * 관리자 화면은 한 번 눌러 사람을 지우고 권한을 올리는 자리다. 남의 페이지에
 * iframe으로 얹혀 클릭을 유도당하면 그대로 실행되므로 프레임을 통째로 막는다.
 *
 * 참가자 화면에는 이름·전화번호·숙소가 있다. 밖으로 나가는 링크에 전체 주소가
 * 딸려 나가지 않게 referrer를 출처까지만 보낸다.
 *
 * 카메라는 체크인 QR 스캔에 쓰므로 우리 출처에만 열어두고, 위치·마이크는 쓰지
 * 않으니 닫는다.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

/** 정본은 miracle2026.org 하나다. 여기로 들어오면 전부 그쪽으로 넘긴다 */
const OTHER_HOSTS = ["www.miracle2026.org", "miracle-conference.vercel.app"];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  /**
   * 옛 주소를 새 주소로 넘긴다.
   *
   * `/my`·`/nanum`·`/bind`는 이미 카톡으로 오갔을 수 있다. 링크를 받은 사람이
   * 404를 보면 우리가 주소를 바꿨다는 걸 알 길이 없다.
   *
   * permanent를 쓰지 않는다 — 308은 브라우저가 영구 캐시해서 되돌리기 어렵다.
   */
  async redirects() {
    return [
      { source: "/my", destination: "/profile", permanent: false },
      { source: "/nanum", destination: "/draw", permanent: false },
      { source: "/bind", destination: "/connect", permanent: false },

      /*
       * 다른 주소로 들어와도 miracle2026.org 하나로 모은다.
       *
       * 주소가 여럿이면 나쁜 게 겹친다 — 카톡으로 오가는 링크가 여러 종류가
       * 되고, 로그인 세션 쿠키는 도메인마다 따로라 이쪽에서 로그인한 사람이
       * 저쪽에서는 손님이 된다. 미리보기 이미지도 여러 벌이 된다.
       *
       * 미리보기 배포(...-git-xxx.vercel.app)는 건드리지 않는다. 그건 배포
       * 전에 확인하려고 여는 주소라 막으면 확인할 길이 없어진다.
       */
      ...OTHER_HOSTS.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://miracle2026.org/:path*",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
