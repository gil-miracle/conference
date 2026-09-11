"use client";

import { useRef, useState } from "react";
import PageHead from "@/components/PageHead";
import PhotoViewer from "@/components/gallery/PhotoViewer";
import Toast from "@/components/Toast";
import { CameraIcon } from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { thumbUrl } from "@/lib/cloudinary";
import { DAYS, photoDay, todayDay } from "@/lib/gallery-days";
import { uploadOnePhoto } from "@/lib/gallery-upload";
import type { Photo } from "@/lib/types";

/**
 * 한 번에 받아 오는 장수.
 *
 * 사흘짜리 행사라 사진이 몇백 장을 넘기 어렵고, 한 줄이 200바이트 남짓이라
 * 넉넉히 받아도 몇십 KB다. 그림 자체는 보이는 것만 받으므로(lazy) 무겁지
 * 않다. 잘게 나눠 받으면 「더 보기」를 누를 때마다 오래된 사진이 위에
 * 끼어들어 읽던 자리를 잃는다.
 */
const PAGE = 200;

/**
 * 우리의 순간들 — 보는 자리다.
 *
 * 올리기는 운영진과 사진 담당(0051)만 — 그 사람에게만 제목 옆에 「사진
 * 올리기」가 붙고, 지금 열어 둔 DAY 칸에 들어간다. 내리고 지우는 일은 여전히
 * 운영진 화면(관리자 → 게시판 → 갤러리 관리)에만 있다. 갤러리는 여기 한
 * 곳뿐이라 올린 사람이 지우면 남들이 이미 본 것이 말없이 사라진다.
 */
export default function GalleryGrid({
  initialPhotos,
  canUpload = false,
  cloudName = null,
}: {
  initialPhotos: Photo[];
  /** 운영진 또는 사진 담당 — 올리기 단추를 그릴지 */
  canUpload?: boolean;
  /** Cloudinary 설정 전이면 단추를 꺼 둔다 */
  cloudName?: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast, showToast } = useToast();

  /* 관리자 화면과 같은 길 — 압축 → 서명 → Cloudinary → 저장. 새로 올린 것은
     맨 뒤에 선다(0039). 하나라도 막히면 그 자리에서 멈추고 사유를 보인다 */
  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 20);
    for (let i = 0; i < list.length; i++) {
      setUploading(`${i + 1}/${list.length}`);
      const result = await uploadOnePhoto(list[i], day + 1);
      if (!result.ok) {
        showToast(result.message, true);
        break;
      }
      setPhotos((prev) => [...prev, result.photo]);
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  /* 오늘이 행사 중이면 오늘 탭으로 연다 — 현장에서 열면 방금 찍은 것이 보여야 한다 */
  const [day, setDay] = useState(todayDay);
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE);
  const [viewing, setViewing] = useState<number | null>(null);

  async function loadMore() {
    // 서버는 최신순으로 준다 — 가장 오래된 것보다 더 이전을 청한다
    const oldest = photos.reduce((a, b) =>
      a.created_at <= b.created_at ? a : b,
    );
    const res = await fetch(
      `/api/photos?before=${encodeURIComponent(oldest.created_at)}`,
    );
    if (!res.ok) return;
    const more = (await res.json()) as Photo[];
    setPhotos((prev) => [...prev, ...more]);
    setHasMore(more.length === PAGE);
  }

  /* 운영진이 정한 차례대로. 사진은 여러 사람 폰에서 모여 와서 올린 시각이
     찍은 시각과 다르다 — 저녁 사진이 아침 사진 앞에 서는 일이 생긴다 */
  const shown = photos
    .filter((p) => photoDay(p) === day)
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.created_at.localeCompare(b.created_at),
    );

  const move = (next: number) => {
    if (next >= 0 && next < shown.length) setViewing(next);
  };

  return (
    <div className="reveal">
      <PageHead
        title="우리의 순간들"
        action={
          canUpload ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <button
                type="button"
                className="head-action"
                disabled={uploading !== null || !cloudName}
                onClick={() => fileRef.current?.click()}
              >
                {uploading
                  ? `올리는 중 ${uploading}`
                  : `DAY ${day + 1}에 올리기`}
              </button>
            </>
          ) : undefined
        }
      />
      <Toast toast={toast} />

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
      {/* 그날 사진이 없으면 격자를 아예 안 그린다 — 빈 격자에 글만 넣으면
          회색 바탕에 줄 하나 얹힌 깨진 모양이 된다. 전체가 비었든 그날만
          비었든 같은 점선 상자로, 문구만 다르게 */}
      {shown.length === 0 ? (
        <div className="locked">
          <CameraIcon />
          <p>
            {photos.length === 0
              ? "아직 올라온 사진이 없어요."
              : "이 날 올라온 사진이 아직 없어요."}
          </p>
        </div>
      ) : (
        <div className="gal-grid" onContextMenu={(e) => e.preventDefault()}>
          {shown.map((photo, i) => (
            <div className="cell" key={photo.id}>
              <button
                type="button"
                className="cell-open"
                onClick={() => setViewing(i)}
              >
                {/* Cloudinary CDN 썸네일 — next/image 미사용 (v1 단순화) */}
                <img
                  src={thumbUrl(photo.cloudinary_public_id)}
                  alt=""
                  loading="lazy"
                />
              </button>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <button className="btn ghost full mt-14" onClick={loadMore}>
          이전 사진 더 보기
        </button>
      )}

      {viewing !== null && (
        <PhotoViewer
          photos={shown}
          at={viewing}
          onMove={move}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
