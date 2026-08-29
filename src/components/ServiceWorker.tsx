"use client";

import { useEffect } from "react";

/**
 * 서비스 워커 등록.
 *
 * 개발 모드에서는 등록하지 않을 뿐 아니라, **예전에 등록된 워커를 지운다.**
 * 같은 오리진(localhost)에서 한 번이라도 프로덕션 빌드를 띄웠으면 워커가 남고,
 * 그 워커는 `/_next/static/`을 캐시 우선으로 돌려준다. 개발 청크는 파일명에
 * 해시가 없어 이름이 그대로라 낡은 번들이 계속 나오고, 서버 HTML만 새것이라
 * "서버는 A, 클라이언트는 B" 하이드레이션 오류가 난다.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => Promise.all(rs.map((r) => r.unregister())))
        .then(() => caches?.keys())
        .then((keys) =>
          Promise.all(
            (keys ?? [])
              .filter((k) => k.startsWith("miracle-"))
              .map((k) => caches.delete(k))
          )
        )
        .catch(() => {
          // 지우지 못해도 개발에 치명적이진 않다
        });
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패해도 사이트는 정상 동작
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
