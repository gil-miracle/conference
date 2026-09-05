"use client";

import { useCallback, useState } from "react";
import FlowHead from "@/components/FlowHead";

/**
 * 홍보 영상 — 오시는 길 아래.
 *
 * 초대 영상과 달리 저절로 재생하지 않는다. 화면을 열자마자 두 영상이 함께
 * 돌면 어느 쪽 소리인지 모르고, 아래에 있는 것은 내려온 사람이 보고 싶어서
 * 내려온 것이라 누를 때 시작하는 편이 맞다.
 *
 * 파일이 아직 없으면 제목까지 통째로 사라진다 — 영상은 나중에 손으로 넣는
 * 자산이라 "없는 상태"가 기본이고, 그때 제목만 덩그러니 남으면 고장으로 보인다.
 */
export default function PromoSection({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  // SSR로 내려온 <video>는 하이드레이션 전에 이미 로드가 실패해 있을 수 있어
  // onError를 놓친다. ref가 붙는 시점에 상태를 직접 확인한다.
  const check = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    if (el.error || el.networkState === el.NETWORK_NO_SOURCE) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    <section id="promo" className="flow">
      <div className="container">
        <FlowHead title={title} />
        <video
          ref={check}
          className="teaser reveal"
          src={src}
          controls
          playsInline
          // 저절로 시작하지 않으니 미리 다 받아 둘 이유가 없다 —
          // 첫 화면이 무거워질 뿐이다
          preload="metadata"
          onError={() => setFailed(true)}
        />
      </div>
    </section>
  );
}
