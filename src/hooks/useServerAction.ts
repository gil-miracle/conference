"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

type RunOptions = {
  /** 값을 주면 실행 전에 확인 대화상자를 띄운다 */
  confirm?: string;
  /** 서버 데이터 재조회를 건너뛴다 (낙관적 UI를 이미 그린 경우) */
  skipRefresh?: boolean;
};

/**
 * 서버 액션 실행 + 화면 갱신 한 묶음.
 *
 * 관리자 화면 버튼은 거의 전부 "액션 호출 → router.refresh() → 그동안 disabled"라는
 * 같은 모양이었다. 그 보일러플레이트를 한곳에 모은다.
 *
 *   const { pending, run } = useServerAction();
 *   <button disabled={pending} onClick={() => run(() => deleteRoom(id), { confirm: "삭제할까요?" })} />
 */
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = useCallback(
    (action: () => Promise<unknown>, options: RunOptions = {}) => {
      if (options.confirm && !window.confirm(options.confirm)) return;
      startTransition(async () => {
        await action();
        if (!options.skipRefresh) router.refresh();
      });
    },
    [router]
  );

  return { pending, run };
}
