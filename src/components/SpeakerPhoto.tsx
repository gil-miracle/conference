"use client";

import { useCallback, useState } from "react";
import type { Speaker } from "@/lib/content";

/**
 * 강사 사진.
 * 파일이 아직 없거나 파일명이 어긋나도 깨진 이미지 아이콘 대신 자리 표시로 떨어진다 —
 * 사진은 손으로 채워 넣는 자산이라 누락이 흔하고, 그때 레이아웃이 무너지면 안 된다.
 */
export default function SpeakerPhoto({ speaker }: { speaker: Speaker }) {
  const [failed, setFailed] = useState(false);

  // SSR로 내려온 <img>는 하이드레이션 전에 이미 404가 끝나 있을 수 있다.
  // 그때는 onError가 오지 않으므로 ref가 붙는 시점에 상태를 직접 확인한다.
  const check = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (!speaker.img || failed) return <div className="ph-fallback">PHOTO</div>;

  return (
    <img
      ref={check}
      src={`/speakers/${speaker.img}`}
      alt={speaker.name}
      onError={() => setFailed(true)}
    />
  );
}
