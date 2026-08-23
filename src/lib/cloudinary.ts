/** Cloudinary 표시 URL — 설계서 6장 변환 프리셋 (클라이언트/서버 공용) */

export function getCloudName(): string | null {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null;
}

function url(publicId: string, transform: string) {
  return `https://res.cloudinary.com/${getCloudName()}/image/upload/${transform}/${publicId}`;
}

/** 그리드 썸네일 */
export function thumbUrl(publicId: string) {
  return url(publicId, "w_400,c_fill,f_auto,q_auto");
}

/** 원본 뷰 */
export function fullUrl(publicId: string) {
  return url(publicId, "w_1600,f_auto,q_auto");
}
