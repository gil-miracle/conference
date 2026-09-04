"use client";

import { useRef, useState } from "react";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { CameraIcon } from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { deletePhoto } from "@/app/actions/gallery";
import { fullUrl, thumbUrl } from "@/lib/cloudinary";
import { uploadOnePhoto } from "@/lib/gallery-upload";
import type { Photo } from "@/lib/types";

const PAGE = 24;

/** 행사 사흘. 사진이 어느 날 것인지는 찍힌 시각으로 가른다 */
const DAYS = ["2026-09-11", "2026-09-12", "2026-09-13"] as const;

/**
 * 사진 한 장이 속한 날.
 *
 * 행사 전에 올라온 시험 사진이나 새벽 2시에 찍혀 날짜가 넘어간 사진이
 * 어느 탭에도 없으면 올린 사람은 사라졌다고 여긴다. 범위 밖은 가까운
 * 쪽 끝날로 붙여 어디서든 보이게 한다.
 */
function dayOf(createdAt: string): number {
  // 한국 시간 기준으로 날짜만 뽑는다 — 서버·브라우저 시간대가 달라도 같게 나온다
  const date = new Date(createdAt).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const i = DAYS.indexOf(date as (typeof DAYS)[number]);
  if (i >= 0) return i;
  return date < DAYS[0] ? 0 : DAYS.length - 1;
}

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
  /* 오늘이 행사 중이면 오늘 탭으로 연다 — 현장에서 열면 방금 찍은 것이 보여야 한다 */
  const [day, setDay] = useState(() => dayOf(new Date().toISOString()));
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const confirm = useConfirm();
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
    const ok = await confirm({
      message: "이 사진을 삭제할까요?",
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
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

  const shown = photos.filter((p) => dayOf(p.created_at) === day);

  return (
    <div className="reveal">
      <div className="day-tabs gal-tabs">
        {DAYS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={day === i ? "on" : ""}
            onClick={() => setDay(i)}
          >
            DAY {i + 1}
          </button>
        ))}
      </div>
      {photos.length === 0 ? (
        <div className="locked">
          <CameraIcon />
          <p>아직 올라온 사진이 없어요. 첫 사진을 올려주세요!</p>
        </div>
      ) : (
        <div className="gal-grid">
          {shown.map((photo) => (
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
          {shown.length === 0 && (
            <p className="msg gal-empty">이 날 올라온 사진이 아직 없어요.</p>
          )}
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
