import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { CameraIcon } from "@/components/icons";
import GalleryDemoGrid from "@/components/gallery/GalleryDemoGrid";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { getPhotos, getSiteContext } from "@/lib/data/site";
import { NEED_BIND, NEED_LOGIN } from "@/lib/messages";

export const metadata: Metadata = { title: "갤러리 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const ctx = await getSiteContext(demo === "1");
  const bound = Boolean(ctx.summary);
  const photos = ctx.galleryOpen && bound && !ctx.demoMode ? await getPhotos(200) : [];

  return (
    <section id="gallery">
      <div className="container">
        {/* 제목은 잠긴 화면에서만 여기서 그린다 — 열린 화면에서는 제목 옆에
            「사진 올리기」가 붙어야 해서 GalleryGrid가 함께 그린다 */}
        {!(ctx.authed && ctx.galleryOpen && bound && !ctx.demoMode) && (
          <PageHead title="우리의 순간들" />
        )}
        {/* 로그인 여부를 먼저 본다 — 아직 안 열린 갤러리를 두고 "컨퍼런스가
            시작되면 열려요"라고 하면, 정작 지금 필요한 것이 무엇인지 안 보인다 */}
        {!ctx.authed ? (
          <Locked icon={<CameraIcon />} showLogin>
            {NEED_LOGIN}
          </Locked>
        ) : !ctx.galleryOpen ? (
          <Locked icon={<CameraIcon />}>
            컨퍼런스가 시작되면 열려요.
            <br />
            현장에서 찍은 사진을 함께 올리고 볼 수 있어요.
          </Locked>
        ) : !bound ? (
          <Locked icon={<CameraIcon />} showBind>
            {NEED_BIND}
          </Locked>
        ) : ctx.demoMode ? (
          <GalleryDemoGrid />
        ) : (
          <GalleryGrid initialPhotos={photos} />
        )}
      </div>
    </section>
  );
}
