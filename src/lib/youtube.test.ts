import { describe, expect, it } from "vitest";
import { extractYoutubeId } from "./youtube";

const ID = "dQw4w9WgXcQ"; // 11자

describe("extractYoutubeId", () => {
  it("운영자가 붙여넣는 주소 형태를 모두 받는다", () => {
    const forms = [
      `https://youtu.be/${ID}`,
      `https://www.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com/watch?list=PL123&v=${ID}`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}`,
      `http://youtube.com/watch?v=${ID}`,
    ];
    for (const url of forms) expect(extractYoutubeId(url)).toBe(ID);
  });

  it("ID를 그대로 넣어도 받는다", () => {
    expect(extractYoutubeId(ID)).toBe(ID);
    expect(extractYoutubeId(`  ${ID}  `)).toBe(ID);
  });

  it("뒤에 파라미터가 붙어도 ID만 뽑는다", () => {
    expect(extractYoutubeId(`https://youtu.be/${ID}?t=30`)).toBe(ID);
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${ID}&t=1m`)).toBe(ID);
  });

  it("하이픈·언더스코어가 든 ID도 받는다", () => {
    expect(extractYoutubeId("https://youtu.be/a-b_c1D2e3F")).toBe("a-b_c1D2e3F");
  });

  it("못 알아보면 null — 잘못된 값을 저장하느니 SOON이 낫다", () => {
    expect(extractYoutubeId("")).toBeNull();
    expect(extractYoutubeId("   ")).toBeNull();
    expect(extractYoutubeId("그냥 곡 제목")).toBeNull();
    expect(extractYoutubeId("https://vimeo.com/12345")).toBeNull();
    expect(extractYoutubeId("tooshort")).toBeNull();
  });
});
