"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { detectInAppBrowser, kakaoExternalUrl } from "@/lib/browser-env";

/** 크롬 계열이 설치할 수 있을 때 던지는 이벤트 — 표준이 아니라 타입이 없다 */
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS 사파리는 display-mode 대신 이 값을 쓴다
  (window.navigator as { standalone?: boolean }).standalone === true;

/** 브라우저마다 설치하는 길이 달라, 안내도 달라야 한다 */
function howTo(): { where: string; steps: string[] } {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);

  if (ios && /crios|fxios|edgios/i.test(ua))
    return {
      where: "iPhone · iPad",
      steps: [
        "이 페이지를 사파리로 열어주세요",
        "아래 공유 단추 → 목록을 내려 「홈 화면에 추가」",
      ],
    };
  if (ios)
    return {
      where: "iPhone · iPad",
      steps: [
        "아래 가운데 공유 단추를 누르고",
        "목록을 내려 「홈 화면에 추가」 — 안 보이면 「더 보기」 안에 있어요",
      ],
    };
  if (/kakaotalk|naver|instagram|fban|fbav|line/i.test(ua))
    return {
      where: "앱 안에서 열린 창",
      steps: [
        "여기서는 설치할 수 없어요",
        "오른쪽 위 메뉴에서 「다른 브라우저로 열기」를 고른 뒤 다시 눌러주세요",
      ],
    };
  if (/android/i.test(ua))
    return {
      where: "Android",
      steps: ["오른쪽 위 점 세 개 메뉴를 누르고", "「앱 설치」 또는 「홈 화면에 추가」를 고르면 돼요"],
    };
  return {
    where: "PC",
    steps: [
      "이미 설치돼 있다면 설치된 앱에서 열어주세요",
      "아니라면 주소창 오른쪽 끝의 설치 아이콘, 또는 오른쪽 위 점 세 개 메뉴 → 「앱 설치」",
    ],
  };
}

/**
 * 홈 화면에 추가.
 *
 * 브라우저 메뉴 안에 숨어 있는 기능이라, 둘 수 있다고 아는 사람만 쓴다.
 * 사흘 내내 열 화면이니 눈에 보이는 자리에 둔다.
 *
 * 설치 이벤트(beforeinstallprompt)는 크롬 계열만, 그것도 조건이 맞을 때만
 * 던진다. 그 이벤트가 있을 때만 단추를 보이면 대부분의 사람에게는 단추가
 * 아예 없고, 눌렀을 때 이벤트가 상해 있으면 아무 일도 안 일어난다.
 *
 * 그래서 앱으로 연 것이 아니면 언제나 보이고, 이벤트가 없거나 실패하면
 * 그 브라우저에서 설치하는 길을 글로 알려 준다. 누르면 무엇이든 일어난다.
 */
export default function InstallButton() {
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [tip, setTip] = useState<ReturnType<typeof howTo> | null>(null);

  useEffect(() => {
    if (standalone()) return;
    setReady(true);

    // 머리에서 미리 받아 둔 것이 있으면 그것부터 쓴다
    const held = (window as { __installPrompt?: InstallPrompt }).__installPrompt;
    if (held) setPrompt(held);

    const onPrompt = (e: Event) => {
      // 브라우저 기본 배너를 막고 우리 단추로 연다
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onReady = () =>
      setPrompt((window as { __installPrompt?: InstallPrompt }).__installPrompt ?? null);
    const onInstalled = () => {
      setReady(false);
      setPrompt(null);
      setTip(null);
      delete (window as { __installPrompt?: InstallPrompt }).__installPrompt;
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("installpromptready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!ready) return null;

  const install = async () => {
    if (!prompt) return setTip(howTo());
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // 이벤트는 한 번만 쓸 수 있다. 상했으면 글로 안내한다
      setTip(howTo());
    }
    // 써 버린 이벤트는 다시 쓸 수 없다
    setPrompt(null);
  };

  return (
    <>
      <button type="button" className="install-btn" onClick={install}>
        앱 설치
      </button>

      {/*
        body에 직접 붙인다. position:fixed는 변형(transform)이 걸린 조상이 있으면
        화면이 아니라 그 조상을 기준으로 잡히는데, 이 단추는 내비 안에 있어서
        시트가 화면 위로 밀려 올라가 잘렸다.
      */}
      {tip &&
        createPortal(
          <div className="install-tip-back" onClick={() => setTip(null)}>
          <div
            className="install-tip"
            role="dialog"
            aria-label="앱 설치 방법"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">{tip.where}</div>
            <ol>
              {tip.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {/* 카톡이면 눌러서 바로 나갈 수 있게 — 글로만 알려 주면 메뉴를
                찾아 헤맨다 */}
            {detectInAppBrowser(navigator.userAgent) === "kakaotalk" && (
              <button
                type="button"
                className="btn accent full mb-10"
                onClick={() => {
                  location.href = kakaoExternalUrl(location.href);
                }}
              >
                기본 브라우저로 열기
              </button>
            )}
            <button type="button" className="btn sm ghost full" onClick={() => setTip(null)}>
              닫기
            </button>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
