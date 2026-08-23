"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 스크롤 리빌 — .reveal 요소에 .in 부여.
 * 레이아웃에 상주하므로 pathname이 바뀔 때마다 다시 관찰해야 한다.
 * (App Router는 페이지만 교체하고 레이아웃 effect를 재실행하지 않는다)
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );

    const observe = () =>
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

    observe();
    // 페이지 전환 직후 DOM이 늦게 붙는 경우 대비
    const raf = requestAnimationFrame(observe);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
