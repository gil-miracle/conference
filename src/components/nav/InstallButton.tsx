"use client";

import { useEffect, useState } from "react";

/** 크롬 계열이 설치할 수 있을 때 던지는 이벤트 — 표준이 아니라 타입이 없다 */
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS 사파리는 display-mode 대신 이 값을 쓴다
  (window.navigator as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

/**
 * 홈 화면에 추가.
 *
 * 브라우저 메뉴 안에 숨어 있는 기능이라, 두어야 한다고 아는 사람만 쓴다.
 * 행사 사흘 동안 계속 열 화면이니 눈에 보이는 자리에 둔다.
 *
 * 설치가 끝났거나 이미 앱으로 열었으면 사라진다 — 누를 수 없는 단추가
 * 남아 있으면 자리만 차지한다.
 *
 * iOS는 설치 이벤트를 주지 않는다. 그래서 그쪽은 「공유 → 홈 화면에 추가」를
 * 알려 주는 것 말고 할 수 있는 일이 없다.
 */
export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onPrompt = (e: Event) => {
      // 브라우저 기본 배너를 막고 우리 단추로 연다
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setPrompt(null);
      setIos(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIos()) setIos(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt && !ios) return null;

  const install = async () => {
    if (!prompt) return setTip(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // 한 번 쓰면 다시 못 쓰는 이벤트다 — 거절해도 버린다
    if (outcome === "accepted") setPrompt(null);
    else setPrompt(null);
  };

  return (
    <>
      <button type="button" className="install-btn" onClick={install}>
        앱 설치
      </button>

      {tip && (
        <div className="install-tip" role="dialog">
          <p>
            사파리 아래쪽 <b>공유</b> 단추를 누르고
            <br />
            <b>홈 화면에 추가</b>를 고르면 돼요.
          </p>
          <button type="button" className="btn sm ghost" onClick={() => setTip(false)}>
            닫기
          </button>
        </div>
      )}
    </>
  );
}
