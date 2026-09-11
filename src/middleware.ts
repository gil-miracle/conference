import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  /*
   * 만료된 세션 토큰 갱신 (쿠키 재발급).
   *
   * 토큰이 아직 넉넉히 남아 있으면 묻지 않는다. getUser는 매번 Supabase에
   * 다녀오는데(100ms 남짓), 로그인한 사람은 화면을 옮길 때마다 그 왕복을
   * 페이지 렌더보다 먼저 치렀다. 만료가 가까울 때만 갱신하면 되고, 검증은
   * 페이지 쪽 getUser가 어차피 한다 — 여기서 읽는 만료 시각은 「갱신할지」를
   * 정하는 데만 쓴다.
   */
  if (tokenExpiresSoon(request)) await supabase.auth.getUser();

  return response;
}

/** 이 안에 만료되면 갱신한다 — 1시간짜리 토큰에서 마지막 10분 */
const REFRESH_WINDOW_S = 10 * 60;

/**
 * 세션 쿠키의 만료 시각을 읽어 곧 만료되는지 본다.
 *
 * 쿠키는 `sb-<프로젝트>-auth-token`(길면 `.0` `.1`로 쪼개짐), 값은 `base64-`
 * 접두 뒤에 세션 JSON. 못 읽으면 true — 모르는 것은 갱신하는 쪽이 안전하다.
 * 쿠키가 아예 없으면 갱신할 것도 없다.
 */
function tokenExpiresSoon(request: NextRequest): boolean {
  const chunks = request.cookies
    .getAll()
    .filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
  if (chunks.length === 0) return false;
  try {
    const raw = chunks
      .sort((a, b) => chunkIndex(a.name) - chunkIndex(b.name))
      .map((c) => c.value)
      .join("");
    const json = raw.startsWith("base64-")
      ? fromBase64Url(raw.slice("base64-".length))
      : decodeURIComponent(raw);
    const session = JSON.parse(json) as { expires_at?: number };
    if (typeof session.expires_at !== "number") return true;
    return session.expires_at - Date.now() / 1000 < REFRESH_WINDOW_S;
  } catch {
    return true;
  }
}

/** Edge 런타임에는 Buffer가 없다 — atob로 푼다 */
function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function chunkIndex(name: string): number {
  const m = /\.(\d+)$/.exec(name);
  return m ? Number(m[1]) : -1;
}

/**
 * 하는 일은 만료된 세션 토큰을 갱신하는 것 하나뿐인데, 그러려고 요청마다
 * Supabase에 한 번 다녀온다. api 라우트는 제 손으로 세션을 확인하므로 여기서
 * 또 다녀올 이유가 없다 — 명단은 5초마다 새로 받아오는 자리라 그 왕복이
 * 그대로 쌓인다.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
