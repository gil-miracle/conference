"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSongSet } from "../actions/songs";

export default function DeleteSetButton({
  setId,
  name,
}: {
  setId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      className="btn sm ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`'${name}' 집회와 그 안의 곡을 모두 삭제할까요?`)) return;
        startTransition(async () => {
          await deleteSongSet(setId);
          router.refresh();
        });
      }}
    >
      집회 삭제
    </button>
  );
}
