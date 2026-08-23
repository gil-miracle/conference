import type { BannerSetting } from "@/lib/types";

/** 관리자 설정의 공지 배너 — visible일 때만 렌더 */
export default function Banner({ banner }: { banner: BannerSetting | null }) {
  if (!banner?.visible || !banner.text) return null;
  return <div className="banner">{banner.text}</div>;
}
