import HeroSection from "@/components/sections/HeroSection";
import FlowHead from "@/components/FlowHead";
import NextSessions from "@/components/home/NextSessions";
import KakaoMap from "@/components/KakaoMap";
import VideoDeck from "@/components/home/VideoDeck";
import { EVENT, THEME_VERSE, ABOUT_LEDE } from "@/lib/content";
import { getPublicSettings } from "@/lib/data/site";

/**
 * 메인은 대제목 없이 얇은 구분선으로만 나눈다 —
 * 포스터 → 주제 말씀 → 3일 일정 → 장소 순으로 한 번에 훑히도록.
 * 상세(전체 일정·방명록·강사)는 메뉴에서 들어간다.
 *
 * 메뉴 설정만 DB에서 오고 그마저 공개 데이터라 쿠키 없이 읽는다.
 * 그래야 정적 프리렌더 + prefetch가 살아 있다.
 */
export const revalidate = 60;

export default async function HomePage() {
  const { menus } = await getPublicSettings();

  return (
    <>
      <HeroSection />

      {/* 주제 말씀 */}
      <section id="about" className="flow">
        <div className="container">
          <FlowHead title="초대" />
          {/* 초대 영상 + 홍보 영상 — 한 재생기에 걸고 썸네일로 넘긴다 */}
          <VideoDeck videos={EVENT.videos} />
          <p className="lede reveal keep-lines">{ABOUT_LEDE}</p>
          <div className="verse reveal">
            <p>{THEME_VERSE.text}</p>
            <span className="ref">{THEME_VERSE.ref}</span>
          </div>
        </div>
      </section>

      {/* 3일 일정 */}
      {menus.timetable && (
        <section id="timetable" className="flow">
          <div className="container">
            <FlowHead title="일정" />
            <NextSessions />
          </div>
        </section>
      )}

      {/* 장소 · 오시는 길 — 늘 보인다. 못 찾아오면 다른 게 다 소용없다 */}
      <section id="venue" className="flow">
        <div className="container">
          <FlowHead title="오시는 길" />
          <div className="place reveal">
            <KakaoMap
              address={EVENT.address}
              label={EVENT.venue}
              fallbackLat={EVENT.lat}
              fallbackLng={EVENT.lng}
            />
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
    </>
  );
}
