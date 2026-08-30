import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("우리 경로는 그대로 돌려준다", () => {
    expect(safeNext("/profile")).toBe("/profile");
    expect(safeNext("/draw?from=1")).toBe("/draw?from=1");
  });

  it("밖으로 나가는 주소는 홈으로 돌린다", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("비어 있으면 홈", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("")).toBe("/");
  });
});
