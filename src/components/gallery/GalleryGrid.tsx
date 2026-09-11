"use client";

import Link from "next/link";
import { useState } from "react";
import PageHead from "@/components/PageHead";
import PhotoViewer from "@/components/gallery/PhotoViewer";
import { CameraIcon } from "@/components/icons";
import { thumbUrl } from "@/lib/cloudinary";
import { DAYS, photoDay, todayDay } from "@/lib/gallery-days";
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
 * 올리고 정리하는 일은 운영진과 사진 담당(0051·0052)의 몫이고, 그 사람에게만
 * 탭 아래에 관리 화면(관리자 → 게시판 → 갤러리)으로 가는 길이 보인다.
 * 갤러리는 여기 한 곳뿐이라 아무나 올린 것이 곧 공식 기록이 된다.
 */
export default function GalleryGrid({
  initialPhotos,
  canUpload = false,
}: {
  initialPhotos: Photo[];
  /** 운영진 또는 사진 담당 — 관리 화면 링크를 그릴지 */
  canUpload?: boolean;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

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

  /* 운영진이 정한 차례를 뒤에서부터 — 방금 올린 것이 왼쪽 위에 서고, 오래된
     것이 아래로 내려간다. 사진은 여러 사람 폰에서 모여 와서 올린 시각이 찍은
     시각과 다르다 — 그래서 차례는 시각이 아니라 sort_order 로 잰다 */
  const shown = photos
    .filter((p) => photoDay(p) === day)
    .sort(
      (a, b) =>
        (b.sort_order ?? 0) - (a.sort_order ?? 0) ||
        b.created_at.localeCompare(a.created_at),
    );

  const move = (next: number) => {
    if (next >= 0 && next < shown.length) setViewing(next);
  };

  return (
    <div className="reveal">
      <PageHead title="우리의 순간들" />

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
      {/* 올릴 수 있는 사람에게만 — 제목 옆이 아니라 탭 아래에, 작은 단추로 */}
      {canUpload && (
        <div className="gal-tools">
          <Link className="btn sm ghost" href="/admin/board">
            사진 올리기 · 정리
          </Link>
        </div>
      )}
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
