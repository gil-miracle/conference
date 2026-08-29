/**
 * 사다리타기의 순수 로직 — 가로 다리 놓기와 경로 따라가기.
 *
 * 그리기·애니메이션과 떼어 둔다. 여기 있는 건 "누가 어디로 가는가"뿐이고,
 * 그건 공정성 문제라 눈으로 확인할 수 없어 테스트로 지킨다.
 */

/** 사다리 층 수 — 화면 높이와 섞임 정도를 함께 정한다 */
export const LADDER_ROWS = 9;

export type Rung = { row: number; col: number };

/**
 * 가로 다리 놓기.
 * 같은 층에 이웃한 다리를 두지 않는다(경로가 갈라진다).
 * 위층과 같은 자리에도 두지 않는다(내려오자마자 되돌아와 제자리가 된다).
 */
export function buildRungs(cols: number, rows = LADDER_ROWS): Rung[] {
  const rungs: Rung[] = [];
  let prev: boolean[] = [];
  for (let row = 0; row < rows; row++) {
    const cur: boolean[] = [];
    let lastCol = -2;
    for (let col = 0; col < cols - 1; col++) {
      if (col - lastCol < 2) continue;
      if (prev[col]) continue;
      if (Math.random() < 0.55) {
        rungs.push({ row, col });
        cur[col] = true;
        lastCol = col;
      }
    }
    prev = cur;
  }
  return rungs;
}

/** 출발 칸에서 내려오며 거치는 이동과 도착 칸 */
export function walk(rungs: Rung[], start: number, rows = LADDER_ROWS) {
  let lane = start;
  const moves: { row: number; from: number; to: number }[] = [];
  for (let row = 0; row < rows; row++) {
    const right = rungs.some((g) => g.row === row && g.col === lane);
    const left = rungs.some((g) => g.row === row && g.col === lane - 1);
    if (!right && !left) continue;
    const to = right ? lane + 1 : lane - 1;
    moves.push({ row, from: lane, to });
    lane = to;
  }
  return { end: lane, moves };
}

/**
 * 심심한 사다리를 걸러 다시 만든다 — 다리 없는 기둥이 있거나
 * 모두 제자리로 도착하면 타 볼 이유가 없다.
 *
 * 여기서 걸러도 공정성은 깨지지 않는다. 도착 칸의 번호를 균등 무작위로
 * 따로 섞기 때문에, 이 단계의 배치가 무엇이든 각 사람이 받는 번호는 균등하다.
 */
export function buildGoodRungs(cols: number, rows = LADDER_ROWS): Rung[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const rungs = buildRungs(cols, rows);
    const everyPoleBridged = Array.from({ length: cols - 1 }, (_, c) =>
      rungs.some((g) => g.col === c)
    ).every(Boolean);
    if (!everyPoleBridged) continue;
    const identity = Array.from({ length: cols }, (_, s) => walk(rungs, s, rows).end).every(
      (end, s) => end === s
    );
    if (!identity) return rungs;
  }
  return buildRungs(cols, rows);
}
