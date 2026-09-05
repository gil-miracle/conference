"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fullUrl, stripUrl } from "@/lib/cloudinary";
import type { Photo } from "@/lib/types";

/**
 * 사진 한 장 크게 보기.
 *
 * 예전에는 원본 주소를 새 탭으로 열었다. 사진 한 장을 보려고 화면을 나갔다가
 * 돌아오면 갤러리는 맨 위로 돌아가 있고, 다음 장을 보려면 다시 찾아 눌러야
 * 했다 — 폰 갤러리에서 하는 일(옆으로 넘기기)이 여기서는 안 됐다.
 *
 * 어둡게 깔고 그 위에 띄운다. 아래에 앞뒤 사진을 작게 늘어놓아 어디쯤인지
 * 보이게 하고, 옆으로 쓸거나 그걸 눌러 넘긴다.
 *
 * body에 직접 붙인다 — position:fixed는 변형이 걸린 조상이 있으면 화면이
 * 아니라 그 조상을 기준으로 잡힌다.
 */
export default function PhotoViewer({
  photos,
  at,
  onMove,
  onClose,
}: {
  photos: Photo[];
  at: number;
  onMove: (next: number) => void;
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement | null>(null);
  const photo = photos[at];

  // 뒤 화면이 같이 굴러다니면 어디를 보고 있는지 흐려진다
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(at - 1);
      if (e.key === "ArrowRight") onMove(at + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, onMove, onClose]);

  // 넘긴 사진이 아래 띠에서도 보이게 따라간다
  useEffect(() => {
    const el = strip.current?.children[at] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [at]);

  const from = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    from.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = from.current;
    from.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    // 아래로 크게 쓸면 닫는다 — 폰 갤러리에서 하던 그 손짓이다
    if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) return onClose();
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    onMove(at + (dx < 0 ? 1 : -1));
  };

  if (!photo) return null;

  return createPortal(
    <div className="pv" role="dialog" aria-label="사진 보기">
      <div className="pv-bar">
        <span className="pv-count">
          {at + 1} / {photos.length}
        </span>
        <button type="button" className="pv-x" aria-label="닫기" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* 사진 바깥을 누르면 닫힌다 — 사진 자체는 눌러도 닫히지 않는다 */}
      <div
        className="pv-stage"
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/*
          한 겹 더 두는 이유 — 자리를 절대 위치로 못 박아야 높이가 정해진다.
          정해지지 않은 칸 안에서 max-height:100%는 「그림 제 높이의 100%」로
          풀려 세로로 긴 사진이 아래로 삐져나갔다.
          그림 상자는 사진 크기 그대로라, 옆 빈자리를 누르면 닫힌다.
        */}
        <div className="pv-frame">
          <img
            key={photo.id}
            src={fullUrl(photo.cloudinary_public_id)}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* 앞뒤 한 장씩 미리 받아 둔다 — 넘겼는데 흰 화면이면 넘긴 보람이 없다 */}
      {[photos[at - 1], photos[at + 1]].map(
        (p) =>
          p && (
            <link
              key={p.id}
              rel="preload"
              as="image"
              href={fullUrl(p.cloudinary_public_id)}
            />
          )
      )}

      {photos.length > 1 && (
        <div className="pv-strip" ref={strip}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`pv-thumb${i === at ? " on" : ""}`}
              aria-label={`${i + 1}번째 사진`}
              onClick={() => onMove(i)}
            >
              <img src={stripUrl(p.cloudinary_public_id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
