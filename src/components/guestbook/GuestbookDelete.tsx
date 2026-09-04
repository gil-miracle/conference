"use client";

import { useState, useTransition } from "react";
import { deleteGuestbookEntry } from "@/app/actions/guestbook";
import { useSession } from "@/components/SessionProvider";
import { useConfirm } from "@/components/Confirm";

/**
 * 본인 글에만 노출되는 삭제 버튼.
 * 소유자 판정은 클라이언트에서 하되, 실제 삭제 권한은 서버 액션과 RLS가 강제한다.
 * (RLS가 막으면 행이 그대로 남으므로 실패를 반드시 사용자에게 알린다 —
 *  조용히 새로고침되면 "지웠는데 왜 남아 있지"가 된다)
 */
export default function GuestbookDelete({
  id,
  ownerId,
}: {
  id: string;
  ownerId: string | null;
}) {
  const { session } = useSession();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  // 내 글이 아니면 버튼 자체를 그리지 않는다
  if (!ownerId || !session.participantId || session.participantId !== ownerId)
    return null;

  return (
    <button
      className="del"
      disabled={pending}
      onClick={async () => {
        const ok = await confirm({
          message: "이 노트를 삭제할까요?",
          confirmLabel: "삭제",
          danger: true,
        });
        if (!ok) return;
        setFailed(false);
        startTransition(async () => {
          const res = await deleteGuestbookEntry(id);
          if (!res.ok) setFailed(true);
        });
      }}
    >
      {pending ? "…" : failed ? "삭제 실패" : "DELETE"}
    </button>
  );
}
