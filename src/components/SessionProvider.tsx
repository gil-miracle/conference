"use client";

import { createContext, useContext } from "react";
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
 * 세션 상태를 클라이언트에서 가져온다.
 * 레이아웃이 서버에서 세션을 조회하면 하위 페이지가 전부 동적이 되어
 * prefetch가 막히므로, 이 부분만 분리해 페이지를 정적으로 유지한다.
 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useSWR<SessionInfo>("/api/session", jsonFetcher<SessionInfo>, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  return (
    <SessionContext.Provider
      value={{ session: data ?? EMPTY, loaded: data !== undefined }}
    >
      {children}
    </SessionContext.Provider>
  );
}
