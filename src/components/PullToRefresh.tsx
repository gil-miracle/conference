"use client";

import { useEffect, useRef, useState } from "react";

/** 이만큼 당기면 새로고침 */
const THRESHOLD = 70;
/** 더 당겨도 이 이상은 안 내려온다 — 끝이 있다는 걸 손으로 알려 준다 */
const MAX = 104;

/**
 * 위로 당겨 새로고침.
 *
 * 홈 화면에서 연 앱에는 주소창이 없다. 새로고침 단추도, 아이폰이라면 당겨서
 * 새로고치는 것도 없다 — 체크인 명단이나 갤러리가 멈춘 채로 남아도 다시
 * 받아올 길이 없어 앱을 껐다 켜야 한다.
 *
 * 브라우저로 열었을 때는 브라우저가 알아서 해 주므로 손대지 않는다. 두 개가
 * 겹치면 한 번 당겼는데 두 번 새로고쳐진다.
 *
 * 맨 위에서 시작한 손짓만 본다. 중간에서 당기는 것은 스크롤이다.
 */
export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(false);
  const from = useRef<number | null>(null);
  const now = useRef(0);

  useEffect(() => {
    const app =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (!app) return;
    setOn(true);

    const set = (v: number) => {
      now.current = v;
      setPull(v);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || window.scrollY > 0) {
        from.current = null;
        return;
      }
      from.current = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (from.current === null) return;
      const dy = e.touches[0].clientY - from.current;
      // 올려 쓸거나 이미 내려갔으면 평범한 스크롤이다 — 손을 뗀다
      if (dy <= 0 || window.scrollY > 0) {
        from.current = null;
        set(0);
        return;
      }
      // 여기서 막지 않으면 화면이 같이 늘어나 당기는 느낌이 두 겹이 된다
      e.preventDefault();
      // 절반만 따라온다 — 손가락보다 덜 움직여야 「당기고 있다」는 감이 산다
      set(Math.min(MAX, dy * 0.5));
    };

    const onEnd = () => {
      if (from.current === null) return;
      from.current = null;
      if (now.current >= THRESHOLD) {
        setBusy(true);
        location.reload();
        return;
      }
      set(0);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (!on || (pull === 0 && !busy)) return null;

  const y = busy ? THRESHOLD : pull;
  return (
    <div
      className={`ptr${busy ? " busy" : ""}`}
      style={{ transform: `translateY(${y}px)` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        // 당긴 만큼 돌아간다 — 다 돌면 놓으라는 뜻이다
        style={{ transform: busy ? undefined : `rotate(${(pull / THRESHOLD) * 270}deg)` }}
      >
        <path d="M20 12a8 8 0 1 1-2.3-5.6" strokeLinecap="round" />
        <path d="M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
