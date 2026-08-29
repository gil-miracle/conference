import { describe, expect, it } from "vitest";
import { buildGoodRungs, buildRungs, walk } from "./ladder";
import { shuffle } from "@/hooks/useNames";

/** 사람 수별로 여러 번 돌려 보는 헬퍼 — 무작위 로직이라 한 번으로는 못 믿는다 */
function each(counts: number[], runs: number, fn: (cols: number) => void) {
  for (const cols of counts) for (let i = 0; i < runs; i++) fn(cols);
}

describe("사다리 배치", () => {
  it("도착 칸이 언제나 순열이다 — 두 사람이 같은 번호를 받으면 안 된다", () => {
    each([2, 3, 4, 6, 10], 400, (cols) => {
      const rungs = buildGoodRungs(cols);
      const ends = Array.from({ length: cols }, (_, s) => walk(rungs, s).end);
      expect(new Set(ends).size).toBe(cols);
    });
  });

  it("같은 층에 이웃한 다리를 놓지 않는다 — 경로가 갈라진다", () => {
    each([4, 6, 10], 400, (cols) => {
      const rungs = buildRungs(cols);
      for (const g of rungs) {
        expect(rungs.some((o) => o.row === g.row && o.col === g.col + 1)).toBe(false);
      }
    });
  });

  it("기둥마다 다리가 하나는 있고, 전원 제자리로 끝나지 않는다", () => {
    each([2, 3, 4, 6, 10], 300, (cols) => {
      const rungs = buildGoodRungs(cols);
      for (let c = 0; c < cols - 1; c++) {
        expect(rungs.some((g) => g.col === c)).toBe(true);
      }
      const ends = Array.from({ length: cols }, (_, s) => walk(rungs, s).end);
      expect(ends.every((e, s) => e === s)).toBe(false);
    });
  });
});

describe("사다리 공정성", () => {
  /*
   * 사다리 자체는 치우쳐 있다 — 가로줄이 아홉 줄뿐이라 섞임이 약해서
   * 왼쪽 사람이 앞 번호를 받을 확률이 훨씬 높다.
   * 도착 칸에 번호를 균등 무작위로 붙이면 그 치우침이 상쇄된다.
   * 이 성질이 깨지면 뽑기가 아니게 되므로 테스트로 지킨다.
   */
  it("어느 자리에서 출발해도 모든 번호를 비슷한 확률로 받는다", () => {
    const N = 6;
    const RUNS = 6000;
    const tally = Array.from({ length: N }, () => new Array<number>(N).fill(0));

    for (let t = 0; t < RUNS; t++) {
      const rungs = buildGoodRungs(N);
      const prizes = shuffle(Array.from({ length: N }, (_, i) => i + 1));
      for (let s = 0; s < N; s++) tally[s][prizes[walk(rungs, s).end] - 1]++;
    }

    const expected = RUNS / N;
    for (const row of tally) {
      for (const hit of row) {
        // 이론값의 ±25% 안 — 6,000회면 우연히 벗어날 일이 사실상 없다
        expect(hit).toBeGreaterThan(expected * 0.75);
        expect(hit).toBeLessThan(expected * 1.25);
      }
    }
  });
});
