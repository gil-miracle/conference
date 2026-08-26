import { requireAdmin } from "@/lib/admin";
import { demoBoardGuestbook } from "@/lib/demo";
import { parseSiteSettings } from "@/lib/settings";
import { getCloudName, thumbUrl } from "@/lib/cloudinary";
import GuestbookModItem, { type ModEntry } from "./GuestbookModItem";
import PhotoModCell from "./PhotoModCell";

export const dynamic = "force-dynamic";

type PhotoRow = { id: string; cloudinary_public_id: string; hidden: boolean };

export default async function AdminBoardPage() {
  const ctx = await requireAdmin();

  let entries: ModEntry[];
  let photos: PhotoRow[] = [];
  let galleryOpen = false;

  if (ctx.demo) {
    entries = demoBoardGuestbook();
  } else {
    const [entriesRes, photosRes, settingsRes] = await Promise.all([
      ctx.supabase
        .from("guestbook")
        .select("id,display_name,content,hidden,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      ctx.supabase
        .from("photos")
        .select("id,cloudinary_public_id,hidden")
        .order("created_at", { ascending: false })
        .limit(60),
      ctx.supabase.from("site_settings").select("key,value"),
    ]);
    entries = (entriesRes.data ?? []) as ModEntry[];
    photos = (photosRes.data ?? []) as PhotoRow[];
    galleryOpen = parseSiteSettings(settingsRes.data).galleryOpen;
  }

  const cloudName = getCloudName();

  return (
    <>
      <div className="sec-title">
        <b>방명록 관리</b>
        <span>
          {entries.length} · 숨김 {entries.filter((e) => e.hidden).length}
        </span>
      </div>
      {entries.length === 0 && <p className="msg">아직 방명록이 없어요.</p>}
      {entries.map((entry) => (
        <GuestbookModItem key={entry.id} entry={entry} />
      ))}

      <div className="sec-title mt-38">
        <b>갤러리 관리</b>
        <span>
          {photos.length}장 · {galleryOpen ? "오픈됨" : "오픈 전"}
        </span>
      </div>
      {photos.length === 0 ? (
        <p className="msg">아직 올라온 사진이 없어요.</p>
      ) : (
        <div className="gal-mod">
          {photos.map((photo) => (
            <PhotoModCell
              key={photo.id}
              id={photo.id}
              hidden={photo.hidden}
              thumb={cloudName ? thumbUrl(photo.cloudinary_public_id) : null}
            />
          ))}
        </div>
      )}
    </>
  );
}
