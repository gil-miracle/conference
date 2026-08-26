"use client";

import { useServerAction } from "@/hooks/useServerAction";
import { deleteGuestbookAdmin, setGuestbookHidden } from "../actions/moderation";

export default function ModButtons({
  id,
  hidden,
}: {
  id: string;
  hidden: boolean;
}) {
  const { pending, run } = useServerAction();

  return (
    <div className="acts">
      <button
        className="btn sm ghost"
        disabled={pending}
        onClick={() => run(() => setGuestbookHidden(id, !hidden))}
      >
        {hidden ? "복구" : "숨김"}
      </button>
      <button
        className="btn sm accent"
        disabled={pending}
        onClick={() =>
          run(() => deleteGuestbookAdmin(id), {
            confirm: "완전히 삭제할까요? 되돌릴 수 없어요.",
          })
        }
      >
        삭제
      </button>
    </div>
  );
}
