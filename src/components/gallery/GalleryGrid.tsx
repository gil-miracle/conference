"use client";

import { useState } from "react";
import PageHead from "@/components/PageHead";
import PhotoViewer from "@/components/gallery/PhotoViewer";
import { CameraIcon } from "@/components/icons";
import { thumbUrl } from "@/lib/cloudinary";
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

/**
 * 우리의 순간들 — 보는 자리다.
 *
 * 올리는 일도 내리는 일도 운영진 화면(관리자 → 게시판 → 갤러리 관리)에만
 * 있다. 갤러리는 여기 한 곳뿐이라 아무나 올린 것이 곧 공식 기록이 되고,
 * 올린 사람이 지우면 남들이 이미 본 것이 말없이 사라진다.
 */
export default function GalleryGrid({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  /* 오늘이 행사 중이면 오늘 탭으로 연다 — 현장에서 열면 방금 찍은 것이 보여야 한다 */
  const [day, setDay] = useState(() => dayOf(new Date().toISOString()));
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE);
  const [viewing, setViewing] = useState<number | null>(null);

  async function loadMore() {
    // 서버는 최신순으로 준다 — 가장 오래된 것보다 더 이전을 청한다
    const oldest = photos.reduce((a, b) => (a.created_at <= b.created_at ? a : b));
    const res = await fetch(
      `/api/photos?before=${encodeURIComponent(oldest.created_at)}`
    );
    if (!res.ok) return;
    const more = (await res.json()) as Photo[];
    setPhotos((prev) => [...prev, ...more]);
    setHasMore(more.length === PAGE);
  }

  /* 운영진이 정한 차례대로. 사진은 여러 사람 폰에서 모여 와서 올린 시각이
     찍은 시각과 다르다 — 저녁 사진이 아침 사진 앞에 서는 일이 생긴다 */
  const shown = photos
    .filter((p) => dayOf(p.created_at) === day)
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.created_at.localeCompare(b.created_at)
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
      {photos.length === 0 ? (
        <div className="locked">
          <CameraIcon />
          <p>아직 올라온 사진이 없어요. 운영진이 올리면 여기 쌓입니다.</p>
        </div>
      ) : (
        <div className="gal-grid">
          {shown.map((photo, i) => (
            <div className="cell" key={photo.id}>
              <button type="button" className="cell-open" onClick={() => setViewing(i)}>
                {/* Cloudinary CDN 썸네일 — next/image 미사용 (v1 단순화) */}
                <img src={thumbUrl(photo.cloudinary_public_id)} alt="" loading="lazy" />
              </button>
            </div>
          ))}
          {shown.length === 0 && (
            <p className="msg gal-empty">이 날 올라온 사진이 아직 없어요.</p>
          )}
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
