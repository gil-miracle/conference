"use client";

import { useRef, useState } from "react";
import Toast from "@/components/Toast";
import { CameraIcon } from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { deletePhoto } from "@/app/actions/gallery";
import { fullUrl, thumbUrl } from "@/lib/cloudinary";
import { uploadOnePhoto } from "@/lib/gallery-upload";
import type { Photo } from "@/lib/types";

const PAGE = 24;

export default function GalleryGrid({
  initialPhotos,
  myId,
  cloudName,
}: {
  initialPhotos: Photo[];
  myId: string | null;
  cloudName: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 10);
    for (let i = 0; i < list.length; i++) {
      setUploading(`${i + 1}/${list.length} 업로드 중…`);
      const result = await uploadOnePhoto(list[i]);
      if (!result.ok) {
        showToast(result.message, true);
        break;
      }
      setPhotos((prev) => [result.photo, ...prev]);
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onDelete(id: string) {
    if (!confirm("이 사진을 삭제할까요?")) return;
    const res = await deletePhoto(id);
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== id));
    else showToast("삭제에 실패했어요.", true);
  }

  async function loadMore() {
    const last = photos[photos.length - 1];
    if (!last) return;
    const res = await fetch(
      `/api/photos?before=${encodeURIComponent(last.created_at)}`
    );
    if (!res.ok) return;
    const more = (await res.json()) as Photo[];
    setPhotos((prev) => [...prev, ...more]);
    setHasMore(more.length === PAGE);
  }

  return (
    <div className="reveal">
      {photos.length === 0 ? (
        <div className="locked">
          <CameraIcon />
          <p>아직 올라온 사진이 없어요. 첫 사진을 올려주세요!</p>
        </div>
      ) : (
        <div className="gal-grid">
          {photos.map((photo) => (
            <div className="cell" key={photo.id}>
              <a
                href={fullUrl(photo.cloudinary_public_id)}
                target="_blank"
                rel="noreferrer"
              >
                {/* Cloudinary CDN 썸네일 — next/image 미사용 (v1 단순화) */}
                <img src={thumbUrl(photo.cloudinary_public_id)} alt="" loading="lazy" />
              </a>
              {myId === photo.participant_id && (
                <button className="del" onClick={() => onDelete(photo.id)}>
                  DEL
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <button className="btn ghost full mt-14" onClick={loadMore}>
          더 보기
        </button>
      )}
      <div className="center mt-30">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          className="btn accent"
          disabled={uploading !== null || !cloudName}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ?? "사진 올리기"}
        </button>
        {!cloudName && (
          <p className="msg err mt-14">
            Cloudinary 설정 전이라 업로드가 꺼져 있어요.
          </p>
        )}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
