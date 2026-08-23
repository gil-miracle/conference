import SectionHead from "@/components/SectionHead";
import GalleryLocked from "@/components/gallery/GalleryLocked";
import GalleryDemoGrid from "@/components/gallery/GalleryDemoGrid";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { getCloudName } from "@/lib/cloudinary";
import type { Photo } from "@/lib/types";

export default function GallerySection({
  initialPhotos,
  open,
  authed,
  bound,
  myId,
  demoMode,
}: {
  initialPhotos: Photo[];
  open: boolean;
  authed: boolean;
  bound: boolean;
  myId: string | null;
  demoMode: boolean;
}) {
  return (
    <section id="gallery">
      <div className="container">
        <SectionHead title="우리의 순간들" idx="GALLERY — 참가자 전용" />
        {!open ? (
          <GalleryLocked showLogin={!authed}>
            컨퍼런스가 끝나면 사진을 올리고 볼 수 있어요.
            <br />
            행사 후 오픈됩니다.
          </GalleryLocked>
        ) : !authed ? (
          <GalleryLocked showLogin>
            갤러리가 열렸어요! 로그인하고 우리의 순간들을 만나보세요.
          </GalleryLocked>
        ) : !bound ? (
          <GalleryLocked showBind>
            신청 명단과 연결하면 사진을 올리고 볼 수 있어요.
          </GalleryLocked>
        ) : demoMode ? (
          <GalleryDemoGrid />
        ) : (
          <GalleryGrid
            initialPhotos={initialPhotos}
            myId={myId}
            cloudName={getCloudName()}
          />
        )}
      </div>
    </section>
  );
}
