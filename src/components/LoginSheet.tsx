"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSupabaseBrowser,
  isSupabaseConfiguredClient,
} from "@/lib/supabase/client";
import { OPEN_LOGIN_EVENT } from "@/lib/ui";
import { EVENT } from "@/lib/content";
import { DEMO_COOKIE } from "@/lib/demo";
import { GoogleIcon, KakaoIcon } from "@/components/icons";
import {
  detectInAppBrowser,
  blocksGoogleOAuth,
  IN_APP_LABEL,
  kakaoExternalUrl,
  type InAppBrowser,
} from "@/lib/browser-env";

export default function LoginSheet() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inApp, setInApp] = useState<InAppBrowser>(null);
  const configured = isSupabaseConfiguredClient();

  // 카카오톡 등 인앱 웹뷰에서는 구글 OAuth가 차단된다
  useEffect(() => {
    setInApp(detectInAppBrowser(navigator.userAgent));
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_LOGIN_EVENT, handler);
    return () => window.removeEventListener(OPEN_LOGIN_EVENT, handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const signIn = useCallback(async (provider: "kakao" | "google") => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
          "/#my"
        )}`,
      },
    });
    if (error) {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(null);
    }
  }, []);

  /** 목업 모드 전용 — 가짜 세션 쿠키로 로그인 후 화면 미리보기 */
  const demoLogin = useCallback(() => {
    document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=86400`;
    location.href = "/#my";
    location.reload();
  }, []);

  if (!open) return null;

  return (
    <div
      className="sheet-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="sheet">
        <h3>참가자 로그인</h3>
        <p className="sub">
          카카오 또는 구글로 로그인해요. 처음이라면 로그인 후 신청 명단(이름 +
          생년월일)과 한 번만 연결하면 돼요.
        </p>
        <button
          className="social-btn kakao"
          onClick={() => signIn("kakao")}
          disabled={!configured || busy !== null}
        >
          <KakaoIcon />
          {busy === "kakao" ? "카카오로 이동 중…" : "카카오로 로그인"}
        </button>
        {blocksGoogleOAuth(inApp) ? (
          <>
            <button
              className="social-btn google"
              onClick={() => {
                const target = `${location.origin}${location.pathname}`;
                location.href =
                  inApp === "kakaotalk"
                    ? kakaoExternalUrl(target)
                    : target;
              }}
              disabled={!configured}
            >
              <GoogleIcon />
              구글로 로그인 — 외부 브라우저로 열기
            </button>
            <p className="note" style={{ textAlign: "left", marginTop: 10 }}>
              {IN_APP_LABEL[inApp!]} 안에서는 구글 정책상 로그인이 막혀 있어요.
              카카오 로그인을 쓰시거나, 위 버튼으로 외부 브라우저에서 열어주세요.
            </p>
          </>
        ) : (
          <button
            className="social-btn google"
            onClick={() => signIn("google")}
            disabled={!configured || busy !== null}
          >
            <GoogleIcon />
            {busy === "google" ? "구글로 이동 중…" : "구글로 로그인"}
          </button>
        )}
        {!configured && (
          <>
            <p className="msg">
              아직 서버(Supabase) 설정 전이라 소셜 로그인은 꺼져 있어요.
              미리보기로 로그인 후 화면을 둘러볼 수 있어요.
            </p>
            <button className="btn accent full" style={{ marginTop: 14 }} onClick={demoLogin}>
              미리보기로 로그인 (데모)
            </button>
          </>
        )}
        {error && <p className="msg err">{error}</p>}
        <p className="note">
          아직 참가 신청 전이라면{" "}
          <a href={EVENT.applyUrl} target="_blank" rel="noreferrer">
            접수 먼저
          </a>{" "}
          해주세요. 문의는 체크인 데스크로.
        </p>
      </div>
    </div>
  );
}
