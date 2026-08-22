"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPhotoHidden } from "../actions/moderation";

export default function PhotoModCell({
  id,
  hidden,
  thumb,
}: {
  id: string;
  hidden: boolean;
  thumb: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className={`cell${hidden ? " dim" : ""}`}>
      {thumb && <img src={thumb} alt="" loading="lazy" />}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setPhotoHidden(id, !hidden);
            router.refresh();
          })
        }
      >
        {hidden ? "SHOW" : "HIDE"}
      </button>
    </div>
  );
}
