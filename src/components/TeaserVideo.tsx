"use client";

import { useCallback, useState } from "react";

/**
 * 홍보 영상 — public/ 아래 파일을 그대로 재생한다.
 *
 * 파일이 아직 없으면 조용히 사라진다. 영상은 나중에 손으로 넣는 자산이라
 * "없는 상태"가 기본이고, 그때 빈 검정 플레이어가 남으면 고장으로 보인다.
 */
export default function TeaserVideo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  // SSR로 내려온 <video>는 하이드레이션 전에 이미 로드가 실패해 있을 수 있어
  // onError를 놓친다. ref가 붙는 시점에 상태를 직접 확인한다.
  const check = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    if (el.error || el.networkState === el.NETWORK_NO_SOURCE) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    <video
      ref={check}
      className="teaser reveal"
      src={src}
      // 자동재생은 브라우저 정책상 음소거일 때만 허용된다.
      // 반복하지 않고 한 번만 재생한다. 소리를 켜거나 다시 볼 사람을 위해
      // controls는 남겨둔다.
      autoPlay
      muted
      controls
      playsInline
      preload="auto"
      onError={() => setFailed(true)}
    />
  );
}
