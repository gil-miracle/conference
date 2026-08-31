import imageCompression from "browser-image-compression";
import type { Photo } from "./types";
import { getUploadSignature, savePhoto } from "@/app/actions/gallery";

export type UploadOutcome =
  | { ok: true; photo: Photo }
  | { ok: false; message: string };

/**
 * 사진 1장 업로드 파이프라인 (설계서 6장):
 * 클라이언트 압축 → 서버 액션 서명 → Cloudinary 직접 업로드 → 메타데이터 저장
 */
export async function uploadOnePhoto(file: File): Promise<UploadOutcome> {
  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 2000,
      maxSizeMB: 1.8,
      useWebWorker: true,
    });

    const sigRes = await getUploadSignature();
    if (!sigRes.ok) return { ok: false, message: sigRes.message };
    const { sig } = sigRes;

    const form = new FormData();
    form.append("file", compressed);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("public_id", sig.publicId);
    form.append("allowed_formats", sig.allowedFormats);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    if (!res.ok) {
      /*
       * Cloudinary가 왜 거절했는지 그대로 올린다. 처음 연동하는 날 틀리는 건
       * 거의 cloud name(404)이나 API secret(401)인데, "업로드에 실패했어요"만
       * 뜨면 어느 쪽인지 알 길이 없어 값을 하나씩 갈아 끼우게 된다.
       *
       * 이 문구는 참가자에게도 보이므로 열쇠 값은 담기지 않는다 — Cloudinary가
       * 주는 것은 사유뿐이다.
       */
      const why = await res
        .json()
        .then((e: { error?: { message?: string } }) => e?.error?.message)
        .catch(() => null);
      return {
        ok: false,
        message: why
          ? `업로드가 거절됐어요 (${res.status}) — ${why}`
          : `업로드가 거절됐어요 (${res.status}). 운영진에 알려주세요.`,
      };
    }
    const json = (await res.json()) as {
      public_id: string;
      width: number;
      height: number;
    };

    const saved = await savePhoto({
      public_id: json.public_id,
      width: json.width,
      height: json.height,
    });
    if (!saved.ok || !saved.photo)
      return { ok: false, message: "저장에 실패했어요." };
    return { ok: true, photo: saved.photo as Photo };
  } catch {
    return { ok: false, message: "업로드에 실패했어요. 다시 시도해주세요." };
  }
}
