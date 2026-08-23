"use client";

import { useSession } from "./SessionProvider";

/** 관리자 공지 배너 — 세션 API에서 받아 표시 */
export default function Banner() {
  const { session } = useSession();
  const banner = session.banner;
  if (!banner?.visible || !banner.text) return null;
  return <div className="banner">{banner.text}</div>;
}
