"use client";

import { useTransition } from "react";
import { deleteGuestbookEntry } from "@/app/actions/guestbook";

export default function GuestbookDelete({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
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
