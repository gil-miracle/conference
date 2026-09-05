import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

/**
 * 관리자에게 보내는 웹 푸시.
 *
 * 보내려면 **남의 구독을 읽어야** 한다. 가입 요청을 넣는 사람은 이제 막
 * 로그인한 미승인 계정이라, 그 세션으로는 RLS가 관리자 구독을 보여주지 않는다.
 * 그래서 이 한 가지 일에만 service_role 키를 쓴다 — 서버에서만 읽히고
 * 클라이언트 번들에는 들어가지 않는다.
 *
 * 키가 없으면 보내지 않고 넘어간다. 알림이 안 오는 것은 불편이지만, 가입
 * 요청 자체가 실패하면 사람이 들어오질 못한다 — 부수적인 일이 본 일을
 * 무너뜨리지 않게 한다.
 */

type PushRow = { endpoint: string; p256dh: string; auth: string };

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@miracle2026.org";
  if (!url || !serviceKey || !publicKey || !privateKey) return null;
  return { url, serviceKey, publicKey, privateKey, subject };
}

/** 설정이 다 들어와 있는가 — 관리자 화면이 "왜 안 오는지"를 말해 줄 수 있게 */
export function isPushConfigured() {
  return config() !== null;
}

/**
 * 관리자 전원에게 알림 한 건.
 *
 * 실패해도 던지지 않는다. 기기를 바꾸거나 알림을 끄면 구독이 죽는데(404·410),
 * 그건 오류가 아니라 "이제 없는 주소"다 — 그 자리에서 지운다. 안 지우면
 * 죽은 주소가 쌓여 보낼 때마다 실패를 되풀이한다.
 */
export async function notifyAdmins(payload: {
  title: string;
  body: string;
  url: string;
  tag?: string;
}): Promise<{ sent: number; removed: number } | null> {
  const c = config();
  if (!c) return null;

  const db = createClient(c.url, c.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await db
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth,participants!inner(role)")
    .eq("participants.role", "admin");
  if (error || !data?.length) return { sent: 0, removed: 0 };

  webpush.setVapidDetails(c.subject, c.publicKey, c.privateKey);
  const body = JSON.stringify(payload);

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    (data as unknown as PushRow[]).map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(row.endpoint);
      }
    })
  );

  if (dead.length) await db.from("push_subscriptions").delete().in("endpoint", dead);
  return { sent, removed: dead.length };
}
