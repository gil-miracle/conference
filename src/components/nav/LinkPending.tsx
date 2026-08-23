"use client";

import { useLinkStatus } from "next/link";

/**
 * 클릭한 링크에만 표시되는 로딩 점.
 * loading.tsx로 페이지 전체를 fallback으로 바꾸면 본문이 사라져 푸터가 튀므로,
 * 이전 페이지를 그대로 둔 채 링크에서만 전환 중임을 알린다.
 * (Link의 자식으로 렌더돼야 useLinkStatus가 해당 Link를 추적한다)
 */
export default function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <i className="link-pending" aria-hidden="true" />;
}
