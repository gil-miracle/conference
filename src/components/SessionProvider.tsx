"use client";

import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/fetcher";
import type { BannerSetting, MenuVisibility } from "@/lib/types";
import { DEFAULT_MENUS } from "@/lib/settings";

export type SessionInfo = {
  authed: boolean;
  bound: boolean;
  /** 승인된 참가자의 본인 id — 소유자 판정용. 그 외에는 null */
  participantId: string | null;
  isAdmin: boolean;
  banner: BannerSetting | null;
  menus: MenuVisibility;
  demoMode: boolean;
};

const EMPTY: SessionInfo = {
  authed: false,
  bound: false,
  participantId: null,
  isAdmin: false,
  banner: null,
  menus: DEFAULT_MENUS,
  demoMode: false,
};

const SessionContext = createContext<{ session: SessionInfo; loaded: boolean }>({
  session: EMPTY,
  loaded: false,
});

export const useSession = () => useContext(SessionContext);

/**
 * 머리(app/layout.tsx)에서 먼저 던져 둔 세션 물음이 있으면 그것을 받아 쓴다.
 * 한 번 쓰고 지운다 — 다음 재검증부터는 보통대로 새로 묻는다.
 */
async function sessionFetcher(url: string): Promise<SessionInfo> {
  const w = window as Window & { __session?: Promise<Response> };
  const early = w.__session;
  if (early) {
    delete w.__session;
    try {
      const res = await early;
      if (res.ok) return (await res.json()) as SessionInfo;
    } catch {
      // 먼저 던진 것이 실패했으면 보통대로 다시 묻는다
    }
  }
  return jsonFetcher<SessionInfo>(url);
}

/** 지난번 세션을 적어 두는 자리 — 다음에 열 때 메뉴가 바로 서게 */
export const SESSION_CACHE_KEY = "miracle.session";

/** 로그아웃할 때 지운다 — 안 지우면 다음 화면에 잠깐 로그인한 척이 남는다 */
export function forgetSession() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // 사생활 보호 모드 등 — 못 지워도 다음 응답이 곧 덮는다
  }
}

/**
 * 세션 상태를 클라이언트에서 가져온다.
 * 레이아웃이 서버에서 세션을 조회하면 하위 페이지가 전부 동적이 되어
 * prefetch가 막히므로, 이 부분만 분리해 페이지를 정적으로 유지한다.
 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useSWR<SessionInfo>("/api/session", sessionFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  /*
   * 지난번에 받은 세션을 먼저 깐다.
   *
   * /api/session은 Supabase에 한 번 다녀오느라 200ms 남짓 걸리고, 그 사이
   * 상단 메뉴와 로그인 단추가 비어 있다가 뒤늦게 뜬다. (물음 자체는 머리에서
   * 먼저 던지지만, 처음 오는 사람에게는 이것도 없다.) 서버 화면과 같은
   * 값으로 하이드레이션한 뒤 곧바로 지난 값으로 채우면, 두 번째 방문부터는
   * 기다림이 눈에 띄지 않는다. 진짜 답이 오면 그것으로 덮는다.
   *
   * 여기 담기는 것은 참·거짓 몇 개와 본인 id뿐이다 (방명록에 이미 실려
   * 나가는 값이다). 이 값으로 무엇을 여는 일은 없다 — 판정은 서버가 한다.
   */
  const [remembered, setRemembered] = useState<SessionInfo | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_CACHE_KEY);
      if (raw) setRemembered(JSON.parse(raw) as SessionInfo);
    } catch {
      // 못 읽어도 그만 — 곧 진짜 답이 온다
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
    } catch {
      // 저장 못 해도 화면은 그대로 돈다
    }
  }, [data]);

  const session = data ?? remembered ?? EMPTY;

  return (
    <SessionContext.Provider
      value={{ session, loaded: data !== undefined || remembered !== null }}
    >
      {children}
    </SessionContext.Provider>
  );
}
