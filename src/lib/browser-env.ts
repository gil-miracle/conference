/**
 * 인앱 브라우저 판별.
 *
 * 카카오톡·라인 등의 인앱 웹뷰에서는 구글이 OAuth를 정책적으로 차단한다
 * (disallowed_useragent). 참가자 대부분이 카톡으로 링크를 받으므로,
 * 인앱에서는 카카오 로그인을 우선 노출하고 구글은 외부 브라우저를 안내한다.
 */
export type InAppBrowser = "kakaotalk" | "naver" | "line" | "instagram" | "facebook" | null;

export function detectInAppBrowser(ua: string = ""): InAppBrowser {
  const s = ua.toLowerCase();
  if (s.includes("kakaotalk")) return "kakaotalk";
  if (s.includes("naver") || s.includes("whale")) return "naver";
  if (s.includes("line/")) return "line";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("fban") || s.includes("fbav")) return "facebook";
  return null;
}

/** 구글 OAuth가 차단되는 환경인지 */
export function blocksGoogleOAuth(browser: InAppBrowser): boolean {
  return browser !== null;
}

export const IN_APP_LABEL: Record<NonNullable<InAppBrowser>, string> = {
  kakaotalk: "카카오톡",
  naver: "네이버 앱",
  line: "라인",
  instagram: "인스타그램",
  facebook: "페이스북",
};

/**
 * 카카오톡 인앱에서 외부 브라우저로 빠져나가는 스킴.
 * 안드로이드는 intent, iOS는 kakaotalk://web/openExternal 을 쓴다.
 */
export function kakaoExternalUrl(url: string): string {
  const isAndroid = /android/i.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent
  );
  if (isAndroid) {
    const noScheme = url.replace(/^https?:\/\//, "");
    return `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
  }
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
}
