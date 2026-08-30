/**
 * 로그인 뒤 돌아갈 경로를 우리 사이트 안으로 묶는다.
 *
 * `?next=`는 주소창에서 아무나 고칠 수 있다. 그대로 붙이면 로그인 링크가
 * 남의 사이트로 사람을 떨구는 데 쓰인다 — 우리 도메인에서 출발했으니 의심 없이
 * 따라간다.
 *
 * `/`로 시작하는지만 보면 모자란다. `//evil.com`과 `/\evil.com`은 붙이는 자리에
 * 따라 프로토콜 상대 주소로 읽혀 밖으로 나간다.
 */
export function safeNext(raw: string | null | undefined, fallback = "/") {
  const next = raw ?? "";
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
