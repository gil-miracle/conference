"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { NEED_BIND } from "@/lib/messages";
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
 *
 * 사진은 운영진만 올린다. 갤러리는 「우리의 순간들」 한 곳뿐이라 아무나
 * 올린 것이 곧 공식 기록이 된다.
 *
 * 갤러리 오픈 여부는 묻지 않는다 — 그건 참가자에게 보일지 말지이고,
 * 운영진은 열기 전에 미리 채워 둘 수 있어야 한다.
 *
 * 발급하는 서명은 그 사람의 고유 public_id에 묶인다 — 재사용해도 같은
 * asset을 덮어쓸 뿐, 무제한 신규 업로드에는 쓸 수 없다.
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
  if (!ctx) return { ok: false, message: NEED_BIND };
  if (ctx.me.role !== "admin")
    return { ok: false, message: "사진은 운영진만 올릴 수 있어요." };

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
 * public_id가 이 사람에게 발급된 형식인지 검증하고
 * (임의 public_id로 숨김 사진 재노출·남의 사진 도용 차단),
 * DB unique 제약이 동일 public_id 재등록을 막는다.
 *
 * 여기서도 운영진인지 다시 본다 — 서명만 막고 저장을 열어 두면 남이 올린
 * 파일을 주워 등록할 수 있다. 정책(0038)이 마지막으로 한 번 더 막는다.
 */
export async function savePhoto(input: {
  public_id: string;
  width: number | null;
  height: number | null;
}) {
  const ctx = await getBoundParticipant();
  if (!ctx || ctx.me.role !== "admin") return { ok: false as const };

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
  // DB에서만 제거 (RLS: admin). Cloudinary 원본 정리는 콘솔에서 일괄.
  // 정책에 막히면 오류가 아니라 0행으로 돌아온다 — 확인하지 않으면 남의 사진을
  // 지운 척하게 된다.
  const { data, error } = await supabase
    .from("photos")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { ok: false };
  revalidatePath("/");
  return { ok: true };
}
