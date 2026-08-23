import "@/styles/site.css";

import Banner from "@/components/Banner";
import Nav from "@/components/Nav";
import LoginSheet from "@/components/LoginSheet";
import RevealObserver from "@/components/RevealObserver";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import SpeakersSection from "@/components/sections/SpeakersSection";
import TimetableSection from "@/components/sections/TimetableSection";
import SongsSection from "@/components/sections/SongsSection";
import GuestbookSection from "@/components/sections/GuestbookSection";
import VideoSection from "@/components/sections/VideoSection";
import MySection from "@/components/sections/MySection";
import GallerySection from "@/components/sections/GallerySection";
import SiteFooter from "@/components/sections/SiteFooter";
import { getHomeData } from "@/lib/data/home";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // ?demo=1 — 목업 단계에서 로그인 후 화면을 바로 보는 미리보기 링크
  const { demo } = await searchParams;
  const data = await getHomeData(demo === "1");
  const bound = Boolean(data.summary);
  const isAdmin = data.summary?.role === "admin";

  return (
    <>
      <Banner banner={data.banner} />
      <Nav authed={data.authed} isAdmin={isAdmin} />
      <HeroSection />
      <AboutSection />
      <SpeakersSection />
      <TimetableSection />
      <SongsSection />
      <GuestbookSection
        entries={data.guestbook}
        authed={data.authed}
        bound={bound}
        open={data.guestbookOpen}
        myParticipantId={data.summary?.id ?? null}
        myName={data.summary?.name ?? null}
      />
      <VideoSection />
      <MySection authed={data.authed} summary={data.summary} />
      <GallerySection
        initialPhotos={data.photos}
        open={data.galleryOpen}
        authed={data.authed}
        bound={bound}
        myId={data.summary?.id ?? null}
        demoMode={data.demoMode}
      />
      <SiteFooter />
      <LoginSheet />
      <RevealObserver />
    </>
  );
}
