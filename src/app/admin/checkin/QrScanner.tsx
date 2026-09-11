"use client";

import { useEffect, useRef, useState } from "react";
import { checkinByToken, type CheckinResult } from "../actions/checkin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const READY = "참가자 QR을 비춰주세요";

type Facing = "environment" | "user";

/**
 * 카메라 QR 스캐너 (html5-qrcode) — 연속 스캔, 3초 중복 방지.
 *
 * 앞면·뒷면을 맞바꿀 수 있다. 데스크에 폰을 세워 두고 참가자가 제 QR 을
 * 화면 쪽으로 대게 하면 앞면(셀카)이 편하다. 장치 목록을 돌리는 방식은
 * 뒷면 렌즈가 셋인 폰에서 앞면까지 서너 번 눌러야 해서 쓰지 않는다.
 */
export default function QrScanner({
  onResult,
  onClose,
}: {
  onResult: (r: CheckinResult) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<React.ReactNode>("카메라 여는 중…");
  /* 어느 쪽 카메라인가 — 처음은 뒷면 */
  const [facing, setFacing] = useState<Facing>("environment");
  /* 결과는 잠깐만 보이고 다시 「비춰주세요」로 돌아간다. 줄 서서 연달아 찍는
     자리라, 앞사람 이름이 남아 있으면 지금 찍힌 건지 아까 것인지 헷갈린다 */
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (node: React.ReactNode, ms: number) => {
    if (flashRef.current) clearTimeout(flashRef.current);
    setStatus(node);
    flashRef.current = setTimeout(() => setStatus(READY), ms);
  };
  const lastRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const busyRef = useRef(false);
  // 콜백은 ref로 최신을 유지 — 부모 재렌더가 카메라를 재시작시키지 않게
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  /** 직전 카메라 정리가 끝났다는 약속 — 다음 열기가 이걸 기다린다 */
  const stopRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    let scanner: {
      start: (...args: never[]) => Promise<unknown>;
      stop: () => Promise<void>;
      clear: () => void;
    } | null = null;

    /* 내리는 일은 비동기다. 카메라를 바꿀 때 새 것을 바로 열면, 이전 정리의
       clear() 가 새로 붙은 영상까지 지워 검은 화면이 남는다. 정리 약속을
       ref 에 두고 다음 열기가 그것을 기다린다 */
    const teardown = () => {
      const inst = scanner;
      scanner = null;
      if (!inst) return;
      stopRef.current = inst
        .stop()
        .then(() => inst.clear())
        .catch(() => {});
    };

    (async () => {
      try {
        await stopRef.current;
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const inst = new Html5Qrcode("qr-reader");
        scanner = inst;
        await inst.start(
          { facingMode: facing },
          {
            fps: 8,
            // 읽는 영역은 화면의 8할 — 고정 230px이면 큰 화면에서 가운데 조그맣게
            // 남아 조준이 까다롭다. 참가자 QR도 이제 화면 가득이라 넉넉히 잡는다
            qrbox: (w: number, h: number) => {
              const side = Math.floor(Math.min(w, h) * 0.8);
              return { width: side, height: side };
            },
          },
          async (text) => {
            const token = text.trim();
            if (!UUID_RE.test(token)) return;
            const now = Date.now();
            if (
              busyRef.current ||
              (lastRef.current.token === token &&
                now - lastRef.current.at < 3000)
            )
              return;
            lastRef.current = { token, at: now };
            busyRef.current = true;
            setStatus("확인 중…");
            try {
              const res = await checkinByToken(token);
              onResultRef.current(res);
              // 이름과 됐다는 말만 — 숙소는 데스크에서 따로 안내할 일이 없다
              if (res.status === "ok")
                flash(
                  <span>
                    ✓ <b>{res.name}</b> 체크인 완료
                  </span>,
                  1000,
                );
              else if (res.status === "already")
                flash(
                  <span>
                    <b>{res.name}</b> 이미 체크인됨
                  </span>,
                  2000,
                );
              else flash("등록되지 않은 QR", 2000);
            } finally {
              busyRef.current = false;
            }
          },
          () => {
            /* 프레임별 미검출 — 무시 */
          },
        );
        // 시작 대기 중에 언마운트됐다면 스트림을 바로 반납 (카메라 점유 방지)
        if (cancelled) {
          teardown();
          return;
        }
        setStatus(READY);
      } catch {
        if (!cancelled)
          setStatus(
            "카메라를 열 수 없어요. 권한을 확인하거나 이름 검색으로 체크인하세요.",
          );
      }
    })();

    return () => {
      cancelled = true;
      if (flashRef.current) clearTimeout(flashRef.current);
      teardown();
    };
    // 앞뒤가 바뀌면 카메라를 내리고 다시 연다 — 그게 곧 전환이다
  }, [facing]);

  const flip = () => {
    setStatus("카메라 바꾸는 중…");
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  };

  return (
    <div className="scan-overlay">
      {/* 닫기는 오른쪽 위 X — 아래 단추 줄은 카메라 전환 하나만 남긴다 */}
      <button
        type="button"
        className="scan-x"
        aria-label="스캔 닫기"
        onClick={onClose}
      >
        ×
      </button>
      <div className="hint">SCAN — CHECK-IN QR</div>
      <div className="scan-box" id="qr-reader" />
      <div className="scan-result">{status}</div>
      <div className="scan-acts">
        <button type="button" className="btn ghost" onClick={flip}>
          {facing === "environment" ? "셀카 모드로" : "뒷면 카메라로"}
        </button>
      </div>
    </div>
  );
}
