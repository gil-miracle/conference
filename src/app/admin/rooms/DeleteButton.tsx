"use client";

import { useServerAction } from "@/hooks/useServerAction";
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
  const { pending, run } = useServerAction();

  return (
    <button
      className="btn-plain del-x"
      aria-label={kind === "room" ? "방 삭제" : "조 삭제"}
      disabled={pending}
      onClick={() =>
        run(() => (kind === "room" ? deleteRoom(id) : deleteTeam(id)), {
          confirm: "삭제할까요?",
        })
      }
    >
      ✕
    </button>
  );
}
