"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/push";

/** base64url VAPID 공개키를 브라우저가 요구하는 바이트 배열로 */
function toBytes(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const b64 = (buf: ArrayBuffer | null) =>
  buf ? btoa(String.fromCharCode(...new Uint8Array(buf))) : "";

/**
 * 가입 요청 알림 받기.
 *
 * 구독은 **기기마다** 생긴다 — 폰에서 켰다고 노트북에도 오지 않는다. 그래서
 * 이 스위치는 사이트 설정이 아니라 "지금 이 기기" 설정이고, 화면에서도 그렇게
 * 말한다. 다른 설정 카드와 달리 서버 값을 켜고 끄는 것이 아니다.
 *
 * iOS는 홈 화면에 추가한 뒤에만 알림을 준다(16.4+). 사파리 탭으로 열어 두면
 * 권한 요청 자체가 막히므로, 그때는 눌러도 되는 것처럼 두지 않고 미리 알린다.
 */
export default function PushCard({ configured }: { configured: boolean }) {
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setBlocked(
        ios
          ? "iPhone·iPad는 홈 화면에 추가한 뒤에만 알림을 받을 수 있어요."
          : "이 브라우저는 알림을 지원하지 않아요."
      );
      return;
    }
    if (Notification.permission === "denied")
      setBlocked("브라우저에서 알림이 차단돼 있어요. 사이트 설정에서 허용으로 바꿔주세요.");

    setReady(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOn(Boolean(sub)))
      .catch(() => {});
  }, []);

  const toggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        await removePushSubscription(existing.endpoint);
        await existing.unsubscribe();
        setOn(false);
        setMsg("이 기기 알림을 껐어요.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("알림이 허용되지 않았어요.");
        return;
      }

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return setMsg("서버에 알림 키가 설정되지 않았어요.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toBytes(key),
      });
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: b64(sub.getKey("p256dh")),
        auth: b64(sub.getKey("auth")),
      });
      if (!res.ok) {
        // 서버가 못 받았으면 브라우저 구독도 남겨 두지 않는다 — 켜진 줄 알고
        // 기다리게 하는 것이 안 오는 것보다 나쁘다
        await sub.unsubscribe();
        return setMsg(res.message);
      }
      setOn(true);
      setMsg(res.message);
    } catch {
      setMsg("알림을 설정하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>가입 요청 알림</b>
          <small>
            새 가입 요청이 오면 이 기기로 알려줍니다 · 기기마다 따로 켜야 해요
          </small>
        </div>
        {ready && !blocked && (
          <button
            className={`toggle${on ? " on" : ""}`}
            aria-label="가입 요청 알림 토글"
            aria-pressed={on}
            disabled={busy}
            onClick={toggle}
          />
        )}
      </div>

      {blocked && <p className="msg mt-12">{blocked}</p>}
      {!configured && (
        <p className="msg mt-12">
          서버에 알림 키가 없어 지금은 보내지지 않아요 — SUPABASE_SERVICE_ROLE_KEY를
          채워주세요.
        </p>
      )}
      {msg && <p className="msg mt-12">{msg}</p>}
    </div>
  );
}
