"use client";

import { useServerAction } from "@/hooks/useServerAction";
import { approveAllPending } from "../actions/approval";

/** 명단 일괄 등록 후 한 번에 승인 */
export default function ApproveAllButton({ count }: { count: number }) {
  const { pending, run } = useServerAction();

  return (
    <button
      className="btn ghost full-w mt-18"
      disabled={pending}
      onClick={() =>
        run(() => approveAllPending(), {
          confirm: `대기 중인 ${count}건을 모두 승인할까요?`,
        })
      }
    >
      {pending ? "승인 중…" : `대기 ${count}건 모두 승인`}
    </button>
  );
}
