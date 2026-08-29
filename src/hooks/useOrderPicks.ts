"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/Confirm";

/**
 * 한 명씩 뽑아 순서를 쌓는 게임(룰렛·폭탄·조건 뽑기)의 공통 상태.
 *
 * 세 게임은 뽑는 방식만 다르고 나머지가 같다 — 남은 사람 계산, 마지막 한 명
 * 자동 확정, 명단이 바뀌면 초기화, 지우기 전 확인. 그 부분을 여기 모은다.
 */
export function useOrderPicks(names: string[], resetLabel: string) {
  const confirm = useConfirm();
  const [taken, setTaken] = useState<string[]>([]);
  /** 연타 방지 — 진행 상태를 state로만 두면 커밋 전에 두 번 눌려 둘 다 통과한다 */
  const busy = useRef(false);

  // 명단이 바뀌면 처음부터 — 없는 사람이 순서에 남아 있으면 안 된다
  const roster = names.join(" ");
  useEffect(() => {
    setTaken([]);
    busy.current = false;
  }, [roster]);

  const pool = names.filter((x) => !taken.includes(x));
  const done = pool.length === 0;

  /**
   * 한 명 확정. 뽑고 나서 한 명만 남으면 그 사람까지 함께 넣는다 —
   * 혼자 남겨 두고 한 번 더 돌리게 하면 결과가 뻔한 판을 억지로 보게 된다.
   */
  const take = useCallback(
    (name: string) => {
      setTaken((prev) => {
        if (prev.includes(name)) return prev;
        const next = [...prev, name];
        const rest = names.filter((x) => !next.includes(x));
        if (rest.length === 1) next.push(rest[0]);
        return next;
      });
    },
    [names]
  );

  /** 지우기 — 이미 정해진 게 있으면 사라진다고 먼저 알린다 */
  const reset = useCallback(
    async (onClear?: () => void) => {
      if (taken.length > 0) {
        const ok = await confirm({
          message: "지금까지 나온 순서를 지우고 처음부터 할까요?",
          confirmLabel: resetLabel,
        });
        if (!ok) return false;
      }
      busy.current = false;
      setTaken([]);
      onClear?.();
      return true;
    },
    [confirm, resetLabel, taken.length]
  );

  return { taken, pool, done, take, reset, busy };
}
