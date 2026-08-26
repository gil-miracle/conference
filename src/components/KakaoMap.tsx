"use client";

import { useEffect, useRef, useState } from "react";

type LatLngLike = unknown;

type KakaoNS = {
  maps: {
    load: (cb: () => void) => void;
    LatLng: new (lat: number, lng: number) => LatLngLike;
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      setCenter: (pos: LatLngLike) => void;
      /** 휠 줌 허용 여부 */
      setZoomable: (on: boolean) => void;
      /** 드래그 이동 허용 여부 */
      setDraggable: (on: boolean) => void;
    };
    Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void };
    services: {
      Geocoder: new () => {
        addressSearch: (
          addr: string,
          cb: (result: { x: string; y: string }[], status: string) => void
        ) => void;
      };
      Status: { OK: string };
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoNS;
  }
}

const SDK_ID = "kakao-maps-sdk";

/** SDK는 한 번만 로드한다 (라우트를 오가도 중복 삽입하지 않게) */
function loadSdk(appKey: string): Promise<KakaoNS> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps?.services) return resolve(window.kakao);

    const onReady = () => {
      if (!window.kakao) return reject(new Error("kakao sdk missing"));
      window.kakao.maps.load(() => resolve(window.kakao!));
    };

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("load fail")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.async = true;
    // services 라이브러리로 주소 → 좌표를 조회한다
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("load fail")), { once: true });
    document.head.appendChild(script);
  });
}

/**
 * 행사 장소 지도.
 * 주소로 좌표를 조회해 마커를 찍는다 — 주소가 바뀌면 지도도 따라온다.
 * 키가 없거나 로드·조회에 실패하면 자리 표시로 조용히 되돌아간다.
 * (지도가 안 떠도 About 페이지 전체가 깨지면 안 되므로)
 */
export default function KakaoMap({
  address,
  label,
  fallbackLat,
  fallbackLng,
}: {
  address: string;
  label: string;
  fallbackLat: number;
  fallbackLng: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!appKey || !ref.current) {
      setFailed(true);
      return;
    }
    let cancelled = false;

    loadSdk(appKey)
      .then((kakao) => {
        if (cancelled || !ref.current) return;

        const draw = (lat: number, lng: number) => {
          if (cancelled || !ref.current) return;
          const center = new kakao.maps.LatLng(lat, lng);
          const map = new kakao.maps.Map(ref.current, { center, level: 4 });
          // 위치만 보여주는 고정 지도. 휠 줌·드래그를 모두 끈다 —
          // 켜두면 페이지 스크롤이 지도에 먹혀 화면이 안 내려가고,
          // 모바일에서는 스와이프가 지도 이동으로 새어 나간다.
          // 자세히 볼 사람은 아래 네이버지도·카카오맵 링크로 간다.
          map.setZoomable(false);
          map.setDraggable(false);
          new kakao.maps.Marker({ position: center }).setMap(map);
        };

        // 주소 조회가 실패하면 좌표로 폴백
        new kakao.maps.services.Geocoder().addressSearch(address, (result, status) => {
          if (status === kakao.maps.services.Status.OK && result[0]) {
            draw(Number(result[0].y), Number(result[0].x));
          } else {
            draw(fallbackLat, fallbackLng);
          }
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [appKey, address, fallbackLat, fallbackLng]);

  if (failed) {
    return <div className="map-ph">MAP — {label}</div>;
  }

  return <div className="map-canvas" ref={ref} aria-label={`${label} 지도`} />;
}
