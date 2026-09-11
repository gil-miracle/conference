"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 체크인 QR — 누르면 화면 가득 커진다.
 *
 * 카드 안의 150px은 보기엔 충분해도 데스크의 스캐너에는 작다. 줄이 밀리는
 * 시간에 폰을 이리저리 대게 하느니, 한 번 눌러 화면 하나를 통째로 QR로
 * 만들어 준다. 바탕은 흰색으로 — 스캐너가 읽는 건 대비다.
 */
export default function QrZoom({ svg }: { svg: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="qr qr-tap"
        aria-label="QR 크게 보기"
        onClick={() => setOpen(true)}
        // qrcode 라이브러리가 만든 신뢰 가능한 SVG 문자열
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <small className="qr-hint">누르면 크게 보여요</small>

      {open &&
        createPortal(
          <div
            className="qr-zoom"
            role="dialog"
            aria-label="체크인 QR"
            onClick={() => setOpen(false)}
          >
            <div className="qr-zoom-code" dangerouslySetInnerHTML={{ __html: svg }} />
            <p>체크인 데스크에서 이 화면을 보여주세요</p>
            <button type="button" className="qr-zoom-x">
              닫기
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
