"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAllPending } from "../actions/approval";

/** 명단 일괄 등록 후 한 번에 승인 */
export default function ApproveAllButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className="btn ghost"
      style={{ width: "100%", marginTop: 18 }}
      disabled={pending}
      onClick={() => {
        if (!confirm(`대기 중인 ${count}건을 모두 승인할까요?`)) return;
        startTransition(async () => {
          await approveAllPending();
          router.refresh();
        });
      }}
    >
      {pending ? "승인 중…" : `대기 ${count}건 모두 승인`}
    </button>
  );
}
