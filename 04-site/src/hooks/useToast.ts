"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastState = { text: string; err?: boolean } | null;

/** 하단 토스트 — 연속 호출 시 이전 타이머를 정리해 새 토스트가 온전히 보이게 */
export function useToast(durationMs = 3200) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string, err = false) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ text, err });
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { toast, showToast };
}
