"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGuestbookAdmin, setGuestbookHidden } from "../actions/moderation";

export default function ModButtons({
  id,
  hidden,
}: {
  id: string;
  hidden: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="acts">
      <button
        className="btn sm ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setGuestbookHidden(id, !hidden);
            router.refresh();
          })
        }
      >
        {hidden ? "복구" : "숨김"}
      </button>
      <button
        className="btn sm accent"
        disabled={pending}
        onClick={() => {
          if (!confirm("완전히 삭제할까요? 되돌릴 수 없어요.")) return;
          startTransition(async () => {
            await deleteGuestbookAdmin(id);
            router.refresh();
          });
        }}
      >
        삭제
      </button>
    </div>
  );
}
