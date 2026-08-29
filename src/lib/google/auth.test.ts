import { afterEach, describe, expect, it } from "vitest";
import { getServiceAccount } from "./auth";

/** 형식만 맞으면 되므로 진짜 키가 아니어도 된다 */
const FAKE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQ==\n-----END PRIVATE KEY-----\n";
const EMAIL = "sheet-reader@miracle-2026.iam.gserviceaccount.com";

function setEnv(key?: string, email?: string) {
  if (key === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = key;
  if (email === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = email;
}

afterEach(() => setEnv(undefined, undefined));

describe("서비스 계정 읽기", () => {
  it("필드 두 개를 따로 넣은 경우", () => {
    setEnv(FAKE_KEY, EMAIL);
    expect(getServiceAccount()).toEqual({ email: EMAIL, key: FAKE_KEY.trim() });
  });

  it(".env에서 \\n으로 이스케이프된 키를 되돌린다", () => {
    setEnv(FAKE_KEY.replace(/\n/g, "\\n"), EMAIL);
    expect(getServiceAccount()?.key).toBe(FAKE_KEY.trim());
  });

  it("JSON 키 파일을 통째로 넣어도 읽는다 — 이메일도 파일에서 가져온다", () => {
    setEnv(
      JSON.stringify({
        type: "service_account",
        project_id: "miracle-2026",
        private_key: FAKE_KEY,
        client_email: EMAIL,
      })
    );
    expect(getServiceAccount()).toEqual({ email: EMAIL, key: FAKE_KEY.trim() });
  });

  it("JSON이 깨져 있으면 null — 반쯤 붙여넣은 값으로 인증을 시도하지 않는다", () => {
    setEnv('{"client_email":"a@b.c","private_key":"-----BEGIN', EMAIL);
    expect(getServiceAccount()).toBeNull();
  });

  it("JSON에 필드가 빠져 있으면 null", () => {
    setEnv(JSON.stringify({ type: "service_account", project_id: "x" }), EMAIL);
    expect(getServiceAccount()).toBeNull();
  });

  it("키가 없거나 형식이 아니면 null", () => {
    setEnv(undefined, EMAIL);
    expect(getServiceAccount()).toBeNull();

    setEnv("그냥 문자열", EMAIL);
    expect(getServiceAccount()).toBeNull();
  });

  it("필드 방식인데 이메일이 없으면 null", () => {
    setEnv(FAKE_KEY);
    expect(getServiceAccount()).toBeNull();
  });
});
