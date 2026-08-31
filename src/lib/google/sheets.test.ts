import { afterEach, describe, expect, it, vi } from "vitest";
import { extractSheetId, readSheetValues } from "./sheets";

/** 인증은 이 파일의 관심사가 아니다 — 토큰은 늘 나온다고 본다 */
vi.mock("./auth", () => ({ getAccessToken: async () => "테스트-토큰" }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe("시트 주소에서 ID 뽑기", () => {
  it("주소를 통째로 붙여넣어도 ID만 남는다", () => {
    expect(
      extractSheetId("https://docs.google.com/spreadsheets/d/abc-123_XYZ/edit#gid=0")
    ).toBe("abc-123_XYZ");
  });

  it("ID만 넣으면 그대로 쓴다", () => {
    expect(extractSheetId("  abc-123_XYZ  ")).toBe("abc-123_XYZ");
  });
});

describe("범위를 못 읽었을 때", () => {
  /** 탭 이름을 바꿨을 때 구글이 주는 응답 */
  const rangeFails = (titles: string[]) =>
    vi.fn(async (url: string) =>
      url.includes("/values/")
        ? json({ error: { message: "Unable to parse range" } }, 400)
        : json({ sheets: titles.map((title) => ({ properties: { title } })) })
    );

  it("실제 탭 이름을 알려준다 — 400만 돌려주면 뭐가 틀렸는지 알 수 없다", async () => {
    vi.stubGlobal("fetch", rangeFails(["설문지 응답 시트1", "정리"]));
    await expect(readSheetValues("sid", "없는탭!A:Z")).rejects.toThrow(
      "'설문지 응답 시트1', '정리'예요"
    );
  });

  it("탭 목록까지 실패하면 원래 안내만 남는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/values/") ? json({}, 400) : json({}, 500)
      )
    );
    await expect(readSheetValues("sid", "없는탭!A:Z")).rejects.toThrow(
      "GOOGLE_SHEETS_RANGE를 확인해주세요"
    );
  });

  it("권한과 문서 없음은 원인이 달라 따로 알린다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 403)));
    await expect(readSheetValues("sid", "A:Z")).rejects.toThrow("'뷰어'로 공유");

    vi.stubGlobal("fetch", vi.fn(async () => json({}, 404)));
    await expect(readSheetValues("sid", "A:Z")).rejects.toThrow("GOOGLE_SHEETS_ID");
  });
});

describe("값 읽기", () => {
  it("빈 시트는 빈 배열 — undefined가 새어 나가지 않게", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({})));
    expect(await readSheetValues("sid", "A:Z")).toEqual([]);
  });
});
