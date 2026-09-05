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

type Platform = "ios" | "android" | "pc";

function detectPlatform(ua: string): Platform {
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document))
    return "ios";
  if (/android/i.test(ua)) return "android";
  return "pc";
}

/* ── 안내에 쓰는 작은 그림들 ────────────────────────────────── */

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 15V3m0 0L8 7m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" strokeLinecap="round" />
    </svg>
  );
}
function PlusBoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 12.5 5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

type Step = { icon: React.ReactNode; title: string; body: string };

const GUIDE: Record<Platform, { tab: string; lead: string; steps: Step[] }> = {
  ios: {
    tab: "iPhone",
    lead: "사파리에서 아래 순서대로 하시면 돼요.",
    steps: [
      {
        icon: <ShareIcon />,
        title: "공유 버튼 누르기",
        body: "화면 아래 가운데, 위로 향한 화살표가 있는 네모를 누르세요.",
      },
      {
        icon: <PlusBoxIcon />,
        title: "「홈 화면에 추가」 고르기",
        body: "목록을 아래로 내리면 있어요. 안 보이면 「더 보기」 안에 있습니다.",
      },
      {
        icon: <CheckIcon />,
        title: "「추가」 누르기",
        body: "오른쪽 위 「추가」를 누르면 홈 화면에 담깁니다.",
      },
    ],
  },
  android: {
    tab: "Android",
    lead: "크롬에서 아래 순서대로 하시면 돼요.",
    steps: [
      {
        icon: <DotsIcon />,
        title: "메뉴 열기",
        body: "주소창 오른쪽 끝의 점 세 개를 누르세요.",
      },
      {
        icon: <DownloadIcon />,
        title: "「앱 설치」 고르기",
        body: "「홈 화면에 추가」로 적혀 있기도 합니다.",
      },
      {
        icon: <CheckIcon />,
        title: "「설치」 누르기",
        body: "확인 창에서 「설치」를 누르면 끝이에요.",
      },
    ],
  },
  pc: {
    tab: "PC",
    lead: "크롬·엣지에서 아래 순서대로 하시면 돼요.",
    steps: [
      {
        icon: <DownloadIcon />,
        title: "주소창 오른쪽 끝 보기",
        body: "화면 모양의 설치 아이콘이 있으면 그걸 누르세요.",
      },
      {
        icon: <DotsIcon />,
        title: "없으면 메뉴에서",
        body: "오른쪽 위 점 세 개 → 「앱 설치」 또는 「캐스트, 저장 및 공유」 안에 있어요.",
      },
      {
        icon: <CheckIcon />,
        title: "「설치」 누르기",
        body: "확인 창에서 「설치」를 누르면 창이 따로 열립니다.",
      },
    ],
  },
};

const ORDER: Platform[] = ["ios", "android", "pc"];

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
 * 그 브라우저에서 설치하는 길을 그림과 함께 알려 준다. 쓰는 기기가 아닌
 * 쪽도 탭으로 열어 둔다 — 「내 폰에서 어떻게 하는지」를 옆 사람에게
 * 보여 줘야 할 때가 있다.
 */
export default function InstallButton() {
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Platform>("ios");
  const [kakao, setKakao] = useState(false);

  useEffect(() => {
    if (standalone()) return;
    setReady(true);
    setTab(detectPlatform(navigator.userAgent));
    setKakao(detectInAppBrowser(navigator.userAgent) === "kakaotalk");

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
      setOpen(false);
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
    if (!prompt) return setOpen(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // 이벤트는 한 번만 쓸 수 있다. 상했으면 글로 안내한다
      setOpen(true);
    }
    // 써 버린 이벤트는 다시 쓸 수 없다
    setPrompt(null);
  };

  const guide = GUIDE[tab];

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
      {open &&
        createPortal(
          <div className="install-tip-back" onClick={() => setOpen(false)}>
            <div
              className="install-tip"
              role="dialog"
              aria-label="앱 설치 방법"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="itip-head">
                <b>앱 설치하기</b>
                <button
                  type="button"
                  className="itip-x"
                  aria-label="닫기"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* 카톡 안에서는 어느 순서를 알려 줘도 소용이 없다 — 먼저 내보낸다 */}
              {kakao && (
                <div className="itip-kakao">
                  <p>카카오톡 안에서는 설치할 수 없어요. 먼저 밖으로 나가야 합니다.</p>
                  <button
                    type="button"
                    className="btn accent full"
                    onClick={() => {
                      location.href = kakaoExternalUrl(location.href);
                    }}
                  >
                    기본 브라우저로 열기
                  </button>
                </div>
              )}

              <div className="itip-tabs" role="tablist" aria-label="기기 고르기">
                {ORDER.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={tab === p}
                    className={tab === p ? "on" : ""}
                    onClick={() => setTab(p)}
                  >
                    {GUIDE[p].tab}
                  </button>
                ))}
              </div>

              <p className="itip-lead">{guide.lead}</p>

              <ol className="itip-steps">
                {guide.steps.map((s, i) => (
                  <li key={s.title}>
                    <span className="itip-no">{i + 1}</span>
                    <span className="itip-ico" aria-hidden="true">
                      {s.icon}
                    </span>
                    <span className="itip-txt">
                      <b>{s.title}</b>
                      <small>{s.body}</small>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="itip-foot">
                설치하면 주소창 없이 앱처럼 열리고, 알림도 받을 수 있어요.
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
