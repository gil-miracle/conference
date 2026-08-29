"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Ask = {
  message: string;
  /** 확인 버튼 글자 — 무슨 일이 일어나는지 적으면 "확인"보다 낫다 */
  confirmLabel?: string;
  /** 되돌릴 수 없는 일이면 확인 버튼을 경고색으로 */
  danger?: boolean;
};

type Pending = Ask & { resolve: (ok: boolean) => void };

/**
 * 확인 창.
 *
 * 브라우저 기본 `confirm()`은 사이트와 따로 놀고 모바일에서는 주소창까지
 * 딸려 나온다. 같은 모양의 모달로 바꾸되, 네이티브 `<dialog>`를 써서
 * 포커스 가둠·Esc 닫기·배경 비활성은 브라우저에 맡긴다.
 */
const ConfirmContext = createContext<(ask: string | Ask) => Promise<boolean>>(
  // 프로바이더가 없으면 최소한 기본 창이라도 뜨게 한다 — 조용히 실행되면 안 된다
  async (ask) => window.confirm(typeof ask === "string" ? ask : ask.message)
);

export const useConfirm = () => useContext(ConfirmContext);

export default function ConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  const confirm = useCallback(
    (ask: string | Ask) =>
      new Promise<boolean>((resolve) => {
        setPending({
          ...(typeof ask === "string" ? { message: ask } : ask),
          resolve,
        });
      }),
    []
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (pending && !el.open) el.showModal();
    if (!pending && el.open) el.close();
  }, [pending]);

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        className="confirm"
        // Esc는 기본 동작이 close라 상태가 남는다 — 직접 취소로 처리한다
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        // 배경(dialog 자신)을 누르면 취소. 안쪽 패널 클릭은 여기까지 안 온다
        onClick={(e) => {
          if (e.target === ref.current) settle(false);
        }}
      >
        {pending && (
          <div className="confirm-in">
            <p>{pending.message}</p>
            <div className="confirm-actions">
              <button className="btn ghost" onClick={() => settle(false)}>
                취소
              </button>
              {/* 처음 포커스는 브라우저가 첫 버튼(취소)에 준다 — 되돌릴 수 없는
                  일에서 Enter가 곧장 실행으로 가지 않으니 그대로 둔다 */}
              <button
                className={`btn${pending.danger ? " danger" : " accent"}`}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? "확인"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
