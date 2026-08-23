"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/icons";

/** 클릭 시 YouTube 경량 임베드 — ID 없으면 COMING SOON 플레이스홀더 */
export default function VideoPlayer({
  youtubeId,
}: {
  youtubeId: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (youtubeId && playing) {
    return (
      <div className="video-embed reveal in">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title="MIRACLE 홍보 영상"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      className="video-ph reveal"
      type="button"
      onClick={() => youtubeId && setPlaying(true)}
      aria-label="홍보 영상 재생"
    >
      <div className="play">
        <PlayIcon />
      </div>
      <small>
        {youtubeId ? "MIRACLE OFFICIAL TEASER" : "TEASER — COMING SOON"}
      </small>
    </button>
  );
}
