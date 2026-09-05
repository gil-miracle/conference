"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DeckVideo = { src: string; poster?: string; label?: string };

/**
 * 영상 한 자리 — 재생기 하나에 여러 편을 걸어 두고 아래 썸네일로 넘긴다.
 *
 * 편마다 재생기를 따로 두면 같은 크기의 검은 판이 화면을 채우고, 뭐가 다른지
 * 알려면 하나씩 눌러 봐야 한다. 하나만 크게 두고 나머지는 그림으로 줄여 두면
 * 「더 있다」는 것과 「뭐가 있는지」가 같이 보인다.
 *
 * 첫 편은 저절로 시작한다(음소거). 브라우저는 소리 있는 자동재생을 막으므로
 * 다른 방법이 없고, 소리를 켜거나 되감을 사람을 위해 컨트롤은 남긴다.
 * 썸네일을 눌러 넘길 때는 사람이 누른 것이라 소리 상태를 그대로 물려준다.
 *
 * 파일이 없는 편은 그 자리만 빠지고, 다 없으면 통째로 사라진다 — 영상은
 * 나중에 손으로 넣는 자산이라 "없는 상태"가 기본이다.
 */
export default function VideoDeck({ videos }: { videos: DeckVideo[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const [sel, setSel] = useState(videos[0]?.src ?? "");
  const ref = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(false);

  const fail = useCallback((src: string) => {
    setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }, []);

  // SSR로 내려온 <video>는 하이드레이션 전에 이미 로드가 실패해 있을 수 있어
  // onError를 놓친다. ref가 붙는 시점에 상태를 직접 확인한다.
  const attach = useCallback(
    (el: HTMLVideoElement | null) => {
      ref.current = el;
      if (!el) return;
      if (el.error || el.networkState === el.NETWORK_NO_SOURCE) fail(el.src);
    },
    [fail]
  );

  const live = videos.filter((v) => !failed.includes(v.src));
  const at = Math.max(
    0,
    live.findIndex((v) => v.src === sel)
  );
  const current = live[at];

  // 넘긴 편은 바로 재생한다. 사람이 눌러서 온 것이라 소리가 켜져 있어도
  // 브라우저가 막지 않는다. 첫 편은 autoPlay가 맡으므로 건드리지 않는다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    el.load();
    el.play().catch(() => {
      // 저전력 모드처럼 재생을 막는 환경이 있다. 그때는 poster가 남는다
    });
  }, [sel]);

  const go = (delta: number) => {
    const next = live[at + delta];
    if (next) setSel(next.src);
  };

  /*
   * 스와이프. 재생바가 있는 아래쪽에서 시작한 손짓은 건드리지 않는다 —
   * 되감으려다 영상이 바뀌면 황당하다. 가로로 충분히 그었을 때만 넘긴다.
   */
  const start = useRef<{ x: number; y: number; live: boolean } | null>(null);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    const box = e.currentTarget.getBoundingClientRect();
    start.current = { x: t.clientX, y: t.clientY, live: t.clientY < box.bottom - 48 };
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    if (!s || !s.live) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? 1 : -1);
  };

  if (!current) return null;

  return (
    <div className="vdeck reveal">
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <video
          ref={attach}
          className="teaser"
          src={current.src}
          poster={current.poster}
          // 자동재생은 브라우저 정책상 음소거일 때만 허용된다
          autoPlay
          muted
          controls
          playsInline
          preload="auto"
          onError={() => fail(current.src)}
        />
      </div>

      {live.length > 1 && (
        <div className="vd-thumbs" role="tablist" aria-label="영상 고르기">
          {live.map((v, i) => (
            <button
              key={v.src}
              type="button"
              role="tab"
              aria-selected={v.src === current.src}
              aria-label={v.label ?? `${i + 1}번째 영상`}
              className={`vd-thumb${v.src === current.src ? " on" : ""}`}
              onClick={() => setSel(v.src)}
            >
              {v.poster ? (
                <img src={v.poster} alt="" loading="lazy" />
              ) : (
                <span>{v.label ?? i + 1}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {current.label && <p className="vd-cap">{current.label}</p>}
    </div>
  );
}
