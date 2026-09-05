"use client";

import { useEffect, useState } from "react";

/**
 * 맨 위로.
 *
 * 아이폰은 상태바를 톡 치면 맨 위로 올라가는데, 홈 화면에서 연 앱에서는
 * 그게 안 먹는다. 일정표나 갤러리처럼 긴 화면에서 위로 돌아갈 길이 없어
 * 손가락으로 한참 쓸어 올려야 한다. 웹에서 그 동작을 되살릴 방법이 없으니
 * 단추를 둔다.
 *
 * 한참 내려갔을 때만 나온다 — 늘 떠 있으면 화면만 가린다. 자리는 하단
 * 탭바 위, 오른쪽 끝이다. 탭바와 겹치지 않게 탭바 높이(60px)와 홈 인디케이터
 * 영역만큼 띄운다.
 */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 한 화면 반쯤 내려갔으면 「돌아갈 길」이 필요한 깊이로 본다
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      className="to-top"
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V6m0 0-6 6m6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
