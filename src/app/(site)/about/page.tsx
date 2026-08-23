import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import VideoPlayer from "@/components/VideoPlayer";
import { ABOUT_LEDE, EVENT, THEME_VERSE } from "@/lib/content";

export const metadata: Metadata = { title: "주제 및 장소 — MIRACLE 2026" };
/** 콘텐츠가 코드에서만 오므로 매 요청 렌더링할 필요가 없다 */
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <section>
      <div className="container">
        <PageHead title="주제 및 장소" idx="ABOUT" lede={ABOUT_LEDE} />

        <div className="verse reveal">
          <p>{THEME_VERSE.text}</p>
          <span className="ref">{THEME_VERSE.ref}</span>
        </div>

        <div className="place reveal">
          <div className="map-ph">MAP — 약도 영역</div>
          <div className="in">
            <b>{EVENT.venue}</b>
            <p>{EVENT.venueSub}</p>
            <div className="map-links">
              <a href={EVENT.naverMapUrl} target="_blank" rel="noreferrer">
                네이버지도
              </a>
              <a href={EVENT.kakaoMapUrl} target="_blank" rel="noreferrer">
                카카오맵
              </a>
            </div>
          </div>
        </div>

        <div className="info-grid reveal">
          <div className="info-card">
            <div className="eyebrow">DATE</div>
            <b>{EVENT.dateLabel}</b>
            <small>금요일 오후 도착 · 주일 점심 파송</small>
          </div>
          <div className="info-card">
            <div className="eyebrow">CHECK-IN</div>
            <b>금 16:00 — 본관 로비</b>
            <small>My 화면의 QR을 보여주세요</small>
          </div>
          <div className="info-card">
            <div className="eyebrow">준비물</div>
            <b>성경 · 필기구 · 세면도구</b>
            <small>숙소 침구는 제공됩니다 (임시)</small>
          </div>
        </div>

        <div className="sub-head reveal">
          <h3>홍보 영상</h3>
        </div>
        <VideoPlayer youtubeId={EVENT.youtubeId} />
      </div>
    </section>
  );
}
