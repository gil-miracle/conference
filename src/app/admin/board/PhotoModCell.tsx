"use client";

import { useServerAction } from "@/hooks/useServerAction";
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
  const { pending, run } = useServerAction();

  return (
    <div className={`cell${hidden ? " dim" : ""}`}>
      {thumb && <img src={thumb} alt="" loading="lazy" />}
      <button disabled={pending} onClick={() => run(() => setPhotoHidden(id, !hidden))}>
        {hidden ? "SHOW" : "HIDE"}
      </button>
    </div>
  );
}
