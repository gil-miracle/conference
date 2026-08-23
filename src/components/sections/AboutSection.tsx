import SectionHead from "@/components/SectionHead";
import { ABOUT_LEDE, EVENT, THEME_VERSE } from "@/lib/content";

export default function AboutSection() {
  return (
    <section id="about">
      <div className="container">
        <SectionHead title="주제 및 장소" idx="01 — ABOUT" />
        <p className="lede reveal">{ABOUT_LEDE}</p>
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
      </div>
    </section>
  );
}
