import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Locked from "@/components/Locked";
import { CameraIcon } from "@/components/icons";
import GalleryDemoGrid from "@/components/gallery/GalleryDemoGrid";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { getPhotos, getSiteContext, hasAuthCookie } from "@/lib/data/site";
import { getPhotographerContext } from "@/lib/admin";
import { NEED_BIND, NEED_LOGIN } from "@/lib/messages";

export const metadata: Metadata = { title: "갤러리 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  /* 세션·사진·권한은 서로 독립이라 한꺼번에 던진다. 줄줄이 기다리면
     로그인한 사람은 왕복 넷을 차례로 기다렸다 — 사진 200장보다 그게 느렸다.
     권한은 세션을 다시 묻는 대신 admin_me 하나로 본다 (진행자 화면과 같은 길) */
  const loggedIn = await hasAuthCookie();
  const [ctx, loadedPhotos, staff] = await Promise.all([
    getSiteContext(demo === "1"),
    loggedIn ? getPhotos(200) : Promise.resolve([]),
    loggedIn ? getPhotographerContext() : Promise.resolve(null),
  ]);
  const bound = Boolean(ctx.summary);
  const open = ctx.galleryOpen && bound && !ctx.demoMode;
  const photos = open ? loadedPhotos : [];
  /* 관리 화면 길은 운영진과 사진 담당에게만. 정책이 어차피 막지만, 못 올리는
     사람에게 보였다가 거절하는 것보다 처음부터 안 보이는 게 낫다 */
  const canUpload = open && Boolean(staff);

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
          <GalleryGrid initialPhotos={photos} canUpload={canUpload} />
        )}
      </div>
    </section>
  );
}
