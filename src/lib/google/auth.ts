import { createSign } from "node:crypto";

/**
 * 구글 서비스 계정 인증.
 *
 * 사용자 동의 없이 서버가 직접 시트를 읽어야 해서 서비스 계정을 쓴다.
 * 흐름은 표준 JWT Bearer: 개인키로 서명한 토큰을 구글에 주고 액세스 토큰을 받는다.
 *
 * googleapis 패키지를 쓰지 않는 이유 — 필요한 건 이 한 흐름뿐인데
 * 그 패키지는 전 API를 끌고 들어와 번들과 콜드 스타트가 무거워진다.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWT_GRANT = "urn:ietf:params:oauth:grant-type:jwt-bearer";
/** 읽기만 한다 — 명단을 고치는 건 사람이 시트에서 할 일이다 */
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

export type ServiceAccount = { email: string; key: string };

/**
 * 환경변수에서 서비스 계정을 읽는다. 두 가지 방식을 모두 받는다.
 *
 * ① **JSON 키 파일 통째로** — `GOOGLE_SERVICE_ACCOUNT_KEY`에 받은 파일 내용을
 *    그대로 붙여넣으면 된다. 어느 필드를 골라야 하는지 헷갈릴 일이 없어
 *    설정 실수가 줄어든다. 이메일도 파일 안에서 가져오므로 따로 넣지 않아도 된다.
 * ② **필드 두 개 따로** — `_EMAIL`에 client_email, `_KEY`에 private_key.
 *
 * 개인키는 여러 줄이라 .env에 넣을 때 \n으로 이스케이프되는 경우가 많다 — 되돌린다.
 */
export function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  if (raw.startsWith("{")) {
    try {
      const json = JSON.parse(raw) as {
        client_email?: string;
        private_key?: string;
      };
      const email = json.client_email?.trim();
      const key = json.private_key?.replace(/\\n/g, "\n").trim();
      if (!email || !key?.includes("BEGIN")) return null;
      return { email, key };
    } catch {
      // 붙여넣다 잘렸거나 형식이 깨진 경우 — 조용히 통과시키지 않는다
      return null;
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = raw.replace(/\\n/g, "\n").trim();
  if (!email || !key.includes("BEGIN")) return null;
  return { email, key };
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** 액세스 토큰 캐시 — 한 번 받으면 한 시간 쓴다. 요청마다 받으면 느리고 할당량도 아깝다 */
let cached: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(scope = SHEETS_SCOPE): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // 만료 1분 전에 미리 버린다 — 경계에서 401이 나면 동기화가 통째로 실패한다
  if (cached && cached.expiresAt - 60 > now) return cached.token;

  const sa = getServiceAccount();
  if (!sa) throw new Error("구글 서비스 계정이 설정되지 않았어요.");

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.email,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${b64url(signer.sign(sa.key))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: JWT_GRANT, assertion: jwt }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`구글 인증 실패 (${res.status}) ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, expiresAt: now + json.expires_in };
  return json.access_token;
}
