import type { MetadataRoute } from "next";

/**
 * 검색 엔진에 노출하지 않는다.
 *
 * 참가자만 오는 사이트다. 이름·숙소·조 배정·체크인 QR이 걸려 있고,
 * 방명록과 갤러리에는 참가자들이 올린 것이 쌓인다. 검색으로 흘러들어온
 * 사람이 볼 이유가 없다.
 *
 * 다만 **메신저 미리보기는 살린다.** 링크를 카톡으로 나누는데 미리보기가
 * 깨지면 포스터도 제목도 안 보이는 맨 주소만 오간다.
 * robots.txt는 가장 구체적인 user-agent 그룹이 이기므로, 아래 봇들은
 * 자기 그룹을 보고 `*` 규칙을 무시한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "kakaotalk-scrap",
          "facebookexternalhit",
          "Twitterbot",
          "Slackbot-LinkExpanding",
          "Discordbot",
        ],
        allow: "/",
      },
      { userAgent: "*", disallow: "/" },
    ],
  };
}
