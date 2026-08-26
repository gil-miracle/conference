import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import GalleryLocked from "@/components/gallery/GalleryLocked";
import GalleryDemoGrid from "@/components/gallery/GalleryDemoGrid";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { getCloudName } from "@/lib/cloudinary";
import { getPhotos, getSiteContext } from "@/lib/data/site";

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
  const photos = ctx.galleryOpen && bound && !ctx.demoMode ? await getPhotos(24) : [];

  return (
    <section id="gallery">
      <div className="container">
        <PageHead title="우리의 순간들" />
        {!ctx.galleryOpen ? (
          <GalleryLocked showLogin={!ctx.authed}>
            컨퍼런스가 시작되면 열려요.
            <br />
            현장에서 찍은 사진을 함께 올리고 볼 수 있어요.
          </GalleryLocked>
        ) : !ctx.authed ? (
          <GalleryLocked showLogin>
            갤러리가 열렸어요! 로그인하고 우리의 순간들을 함께 나눠요.
          </GalleryLocked>
        ) : !bound ? (
          <GalleryLocked showBind>신청 명단과 연결하면 사진을 올리고 볼 수 있어요.</GalleryLocked>
        ) : ctx.demoMode ? (
          <GalleryDemoGrid />
        ) : (
          <GalleryGrid
            initialPhotos={photos}
            myId={ctx.summary?.id ?? null}
            cloudName={getCloudName()}
          />
        )}
      </div>
    </section>
  );
}
