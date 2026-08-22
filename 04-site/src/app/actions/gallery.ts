"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getBoundParticipant } from "@/lib/participant";

const FOLDER = "miracle2026";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic,gif";

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  allowedFormats: string;
};

/**
 * Cloudinary signed upload 서명 발급 (설계서 6장 — unsigned preset 금지).
 * 세션 + 명단 바인딩 + 갤러리 오픈 확인 후, 참가자별 고유 public_id에
 * 스코프된 서명을 발급한다 — 재사용해도 같은 asset을 덮어쓸 뿐,
 * 무제한 신규 업로드에는 쓸 수 없다.
 */
export async function getUploadSignature(): Promise<
  { ok: true; sig: UploadSignature } | { ok: false; message: string }
> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    return { ok: false, message: "Cloudinary 설정 전이에요." };

  const ctx = await getBoundParticipant();
  if (!ctx)
    return { ok: false, message: "로그인 후 명단 연결이 필요해요." };

  const { data: setting } = await ctx.supabase
    .from("site_settings")
    .select("value")
    .eq("key", "gallery_open")
    .maybeSingle();
  const open = (setting?.value as { value?: boolean } | null)?.value === true;
  if (!open) return { ok: false, message: "갤러리가 아직 열리지 않았어요." };

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${ctx.me.id}-${timestamp}-${randomUUID().slice(0, 8)}`;
  // Cloudinary 서명: 파라미터 알파벳순 정렬 + secret
  const toSign =
    `allowed_formats=${ALLOWED_FORMATS}&folder=${FOLDER}` +
    `&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  return {
    ok: true,
    sig: {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: FOLDER,
      publicId,
      allowedFormats: ALLOWED_FORMATS,
    },
  };
}

/**
 * 업로드 완료 후 메타데이터 저장.
 * public_id가 이 참가자에게 발급된 형식인지 검증하고
 * (임의 public_id로 숨김 사진 재노출·타인 사진 도용 차단),
 * DB unique 제약이 동일 public_id 재등록을 막는다.
 */
export async function savePhoto(input: {
  public_id: string;
  width: number | null;
  height: number | null;
}) {
  const ctx = await getBoundParticipant();
  if (!ctx) return { ok: false as const };

  const expectedPrefix = `${FOLDER}/${ctx.me.id}-`;
  if (
    !input.public_id.startsWith(expectedPrefix) ||
    !/^[\w/-]+$/.test(input.public_id)
  )
    return { ok: false as const };

  const clamp = (n: number | null) =>
    typeof n === "number" && n > 0 && n <= 20000 ? Math.floor(n) : null;

  const { data, error } = await ctx.supabase
    .from("photos")
    .insert({
      participant_id: ctx.me.id,
      cloudinary_public_id: input.public_id,
      width: clamp(input.width),
      height: clamp(input.height),
    })
    .select()
    .single();

  if (error) return { ok: false as const };
  revalidatePath("/");
  return { ok: true as const, photo: data };
}

export async function deletePhoto(id: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  // DB에서만 제거 (RLS: 본인 또는 admin). Cloudinary 원본 정리는 콘솔에서 일괄.
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return { ok: false };
  revalidatePath("/");
  return { ok: true };
}
