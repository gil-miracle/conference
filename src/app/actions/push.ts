"use server";

import { getBoundParticipant } from "@/lib/participant";

/**
 * 알림 구독 저장·해제.
 *
 * 구독은 브라우저가 기기마다 새로 만든다 — 폰에서 켰다고 노트북에도 오지
 * 않는다. 그래서 켠 기기의 것을 그때그때 넣고, 끄면 그 하나만 뺀다.
 *
 * 남의 것을 건드릴 수 없게 RLS가 본인 행만 열어 두었고, 여기서도 명단에
 * 연결된 사람인지부터 본다.
 */

type Result = { ok: boolean; message: string };

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<Result> {
  const ctx = await getBoundParticipant();
  if (!ctx) return { ok: false, message: "로그인이 필요합니다." };
  if (!sub.endpoint || !sub.p256dh || !sub.auth)
    return { ok: false, message: "구독 정보가 올바르지 않아요." };

  const { data, error } = await ctx.supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: sub.endpoint,
        participant_id: ctx.me.id,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
      { onConflict: "endpoint" }
    )
    .select("endpoint");
  if (error) return { ok: false, message: error.message };
  // 정책에 막히면 오류가 아니라 0행이 온다 — 켠 척하지 않는다
  if (!data?.length) return { ok: false, message: "알림을 켜지 못했어요." };

  return { ok: true, message: "이 기기로 알림을 받습니다." };
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  const ctx = await getBoundParticipant();
  if (!ctx) return { ok: false, message: "로그인이 필요합니다." };

  const { error } = await ctx.supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "이 기기 알림을 껐어요." };
}
