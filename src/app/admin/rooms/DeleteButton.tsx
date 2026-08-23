"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRoom } from "../actions/rooms";
import { deleteTeam } from "../actions/teams";

/** 비어 있는 방/조 삭제 (인원이 있으면 렌더되지 않음) */
export default function DeleteButton({
  kind,
  id,
}: {
  kind: "room" | "team";
  id: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      style={{
        background: "none",
        border: "none",
        color: "var(--coral)",
        fontFamily: "inherit",
        fontSize: "inherit",
        marginLeft: 8,
        padding: 0,
        letterSpacing: "inherit",
      }}
      onClick={() => {
        if (!confirm("삭제할까요?")) return;
        startTransition(async () => {
          if (kind === "room") await deleteRoom(id);
          else await deleteTeam(id);
          router.refresh();
        });
      }}
    >
      ✕
    </button>
  );
}
