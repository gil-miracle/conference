"use client";

import { useEffect, useRef, useState } from "react";
import { checkinByToken, type CheckinResult } from "../actions/checkin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 카메라 QR 스캐너 (html5-qrcode) — 연속 스캔, 3초 중복 방지 */
export default function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (r: CheckinResult) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<React.ReactNode>("카메라 여는 중…");
  const lastRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const busyRef = useRef(false);
  // 콜백은 ref로 최신을 유지 — 부모 재렌더가 카메라를 재시작시키지 않게
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let cancelled = false;
    let scanner: {
      start: (...args: never[]) => Promise<unknown>;
      stop: () => Promise<void>;
      clear: () => void;
    } | null = null;

    const teardown = () => {
      scanner
        ?.stop()
        .then(() => scanner?.clear())
        .catch(() => {});
    };

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const inst = new Html5Qrcode("qr-reader");
        scanner = inst;
        await inst.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: 230 },
          async (text) => {
            const token = text.trim();
            if (!UUID_RE.test(token)) return;
            const now = Date.now();
            if (
              busyRef.current ||
              (lastRef.current.token === token && now - lastRef.current.at < 3000)
            )
              return;
            lastRef.current = { token, at: now };
            busyRef.current = true;
            setStatus("확인 중…");
            try {
              const res = await checkinByToken(token);
              onResultRef.current(res);
              setStatus(
                res.status === "ok" ? (
                  <span>
                    ✓ <b>{res.name}</b> 체크인 완료
                    {res.room ? ` — ${res.room}` : ""}
                  </span>
                ) : res.status === "already" ? (
                  <span>
                    <b>{res.name}</b> 이미 체크인됨
                  </span>
                ) : (
                  "등록되지 않은 QR"
                )
              );
            } finally {
              busyRef.current = false;
            }
          },
          () => {
            /* 프레임별 미검출 — 무시 */
          }
        );
        // 시작 대기 중에 언마운트됐다면 스트림을 바로 반납 (카메라 점유 방지)
        if (cancelled) {
          teardown();
          return;
        }
        setStatus("참가자 QR을 비춰주세요");
      } catch {
        if (!cancelled)
          setStatus(
            "카메라를 열 수 없어요. 권한을 확인하거나 이름 검색으로 체크인하세요."
          );
      }
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return (
    <div className="scan-overlay">
      <div className="hint">SCAN — CHECK-IN QR</div>
      <div className="scan-box" id="qr-reader" />
      <div className="scan-result">{status}</div>
      <button className="btn ghost scan-close" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
