"use client";

import { useServerAction } from "@/hooks/useServerAction";
import { deleteSongSet } from "../actions/songs";

export default function DeleteSetButton({
  setId,
  name,
}: {
  setId: string;
  name: string;
}) {
  const { pending, run } = useServerAction();

  return (
    <button
      className="btn sm ghost"
      disabled={pending}
      onClick={() =>
        run(() => deleteSongSet(setId), {
          confirm: `'${name}' 집회와 그 안의 곡을 모두 삭제할까요?`,
        })
      }
    >
      집회 삭제
    </button>
  );
}
