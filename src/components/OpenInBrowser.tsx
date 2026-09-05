"use client";

import { useEffect } from "react";
import { detectInAppBrowser, kakaoExternalUrl } from "@/lib/browser-env";

const TRIED = "miracle:left-inapp";

/**
 * 카카오톡 안에서 열렸으면 기본 브라우저로 넘긴다.
 *
 * 링크는 거의 카톡으로 오간다. 그런데 카톡 인앱에서는 구글 로그인이 정책적으로
 * 막히고, 홈 화면에 추가도 안 되고, 알림도 못 받는다 — 참가자가 여기서 할 수
 * 있는 일이 별로 없다. 들어오자마자 밖으로 보내는 편이 낫다.
 *
 * 주소를 통째로 넘기므로 「토요일 일정」 링크를 받은 사람은 그 화면으로
 * 그대로 도착한다.
 *
 * 한 번만 시도한다. 스킴이 막혀 있으면 그 자리에 남는데, 그때 계속 다시
 * 시도하면 화면이 깜빡이기만 하고 아무 데도 못 간다.
 */
export default function OpenInBrowser() {
  useEffect(() => {
    if (detectInAppBrowser(navigator.userAgent) !== "kakaotalk") return;
    try {
      if (sessionStorage.getItem(TRIED)) return;
      sessionStorage.setItem(TRIED, "1");
    } catch {
      // 저장이 막힌 환경(시크릿 등)에서는 한 번만 하고 만다
    }
    location.href = kakaoExternalUrl(location.href);
  }, []);

  return null;
}
