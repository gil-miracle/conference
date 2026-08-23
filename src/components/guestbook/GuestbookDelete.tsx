"use client";

import { useTransition } from "react";
import { deleteGuestbookEntry } from "@/app/actions/guestbook";
import { useSession } from "@/components/SessionProvider";

/**
 * 본인 글에만 노출되는 삭제 버튼.
 * 소유자 판정은 클라이언트에서 하되, 실제 삭제 권한은 서버 액션과 RLS가 강제한다.
 */
export default function GuestbookDelete({
  id,
  ownerId,
}: {
  id: string;
  ownerId: string | null;
}) {
  const { session } = useSession();
  const [pending, startTransition] = useTransition();

  if (!session.authed || !session.bound || !ownerId) return null;

  return (
    <button
      className="del"
      disabled={pending}
      onClick={() => {
        if (confirm("이 방명록을 삭제할까요?"))
          startTransition(() => deleteGuestbookEntry(id));
      }}
    >
      {pending ? "…" : "DELETE"}
    </button>
  );
}
