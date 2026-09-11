"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 이 간격으로 묻는다 — 데스크 명단이 새로 받는 간격과 같다 */
const EVERY_MS = 5_000;

/**
 * QR을 띄운 동안 체크인됐는지 지켜본다.
 *
 * 데스크에서 찍으면 그 자리에서 화면이 「체크인 완료」로 바뀌어야 한다.
 * 안 그러면 참가자는 QR을 계속 들고 있고, 데스크는 "됐어요"를 말로 해야
 * 한다. 바뀐 것이 확인되면 서버 화면을 다시 받는다 — 그러면 이 컴포넌트가
 * 놓인 QR 카드 자체가 완료 카드로 갈린다.
 *
 * 5초마다 한 칸짜리 물음이다. 탭이 뒤로 가 있을 땐 쉰다.
 */
export default function CheckinWatch() {
  const router = useRouter();

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/me/checkin", { cache: "no-store" });
          if (res.ok) {
            const { checkedInAt } = (await res.json()) as { checkedInAt: string | null };
            if (checkedInAt) {
              router.refresh();
              return; // 완료 카드로 바뀌면서 여기도 내려간다
            }
          }
        } catch {
          // 잠깐 끊긴 것 — 다음 차례에 다시 묻는다
        }
      }
      timer = setTimeout(tick, EVERY_MS);
    };

    // 뒤로 갔다 돌아오면 기다리지 않고 바로 한 번 묻는다
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    timer = setTimeout(tick, EVERY_MS);

    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
