"use client";

import useSWR from "swr";
import { ADMIN_POLL_MS, jsonFetcher } from "@/lib/fetcher";
import type { JoinRequest } from "@/lib/types";
import JoinRequestCard from "./JoinRequestCard";
import ApproveAllButton from "./ApproveAllButton";

/**
 * 가입 요청 목록 — 폴링(SWR). 대시보드·참가자 명단과 같은 주기다.
 *
 * 승인 화면을 열어 두면 새로 들어온 요청이 스스로 나타난다 — 등록 데스크에서
 * 「가입했어요」 소리를 들을 때마다 새로고침을 누르던 일을 없앤다. 승인·반려한
 * 것은 다음 폴링에 목록에서 빠지되, 그 전에 카드에 「승인됨」이 먼저 뜬다.
 */
export default function ApprovalsList({ demo }: { demo: boolean }) {
  const { data, error, mutate } = useSWR<JoinRequest[]>(
    "/api/admin/join-requests",
    jsonFetcher<JoinRequest[]>,
    { refreshInterval: ADMIN_POLL_MS, keepPreviousData: true },
  );

  if (error)
    return (
      <p className="msg err">
        가입 요청을 불러오지 못했어요. 새로고침 해주세요.
      </p>
    );
  if (!data) return <p className="upd">LOADING…</p>;
  if (data.length === 0)
    return <p className="msg">대기 중인 가입 요청이 없어요.</p>;

  return (
    <>
      {data.map((req) => (
        <JoinRequestCard key={req.id} request={req} onDone={() => mutate()} />
      ))}
      {!demo && data.length > 1 && (
        <ApproveAllButton count={data.length} onDone={() => mutate()} />
      )}
    </>
  );
}
