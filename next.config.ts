import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
