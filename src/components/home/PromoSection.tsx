"use client";

import { useCallback, useState } from "react";
import FlowHead from "@/components/FlowHead";

export type PromoVideo = { src: string; poster?: string; label?: string };

/**
 * 홍보 영상 — 일정과 오시는 길 사이.
 *
 * 초대 영상과 달리 저절로 재생하지 않는다. 화면을 열자마자 여러 영상이 함께
 * 돌면 어느 쪽 소리인지 모르고, 아래에 있는 것은 내려온 사람이 보고 싶어서
 * 내려온 것이라 누를 때 시작하는 편이 맞다.
 *
 * 두 편이어도 나란히 놓지 않고 쌓는다. 본문 폭이 640px이라 반으로 나누면
 * 한 편이 311px — 데스크톱에서 보는 영상이 폰에서 보는 것보다 작아진다.
 * 대신 아래에 이름을 붙여 두 편이 뭐가 다른지 알린다.
 *
 * 파일이 없는 것은 그 자리만 빠지고, 다 없으면 제목까지 통째로 사라진다 —
 * 영상은 나중에 손으로 넣는 자산이라 "없는 상태"가 기본이고, 그때 제목만
 * 덩그러니 남으면 고장으로 보인다.
 */
export default function PromoSection({
  videos,
  title,
}: {
  videos: PromoVideo[];
  title: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);

  const fail = useCallback((src: string) => {
    setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }, []);

  // SSR로 내려온 <video>는 하이드레이션 전에 이미 로드가 실패해 있을 수 있어
  // onError를 놓친다. ref가 붙는 시점에 상태를 직접 확인한다.
  const check = useCallback(
    (src: string) => (el: HTMLVideoElement | null) => {
      if (!el) return;
      if (el.error || el.networkState === el.NETWORK_NO_SOURCE) fail(src);
    },
    [fail]
  );

  const live = videos.filter((v) => !failed.includes(v.src));
  if (live.length === 0) return null;

  return (
    <section id="promo" className="flow">
      <div className="container">
        <FlowHead title={title} />
        {live.map((v) => (
          <figure key={v.src} className="promo-item">
            <video
              ref={check(v.src)}
              className="teaser reveal"
              src={v.src}
              // 눌러야 시작하는 영상이라, 누르기 전까지 보이는 건 이 그림뿐이다
              poster={v.poster}
              controls
              playsInline
              // 저절로 시작하지 않으니 미리 다 받아 둘 이유가 없다 —
              // 첫 화면이 무거워질 뿐이다
              preload="metadata"
              onError={() => fail(v.src)}
            />
            {v.label && <figcaption className="promo-cap">{v.label}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
