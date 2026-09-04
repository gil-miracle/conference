import { requireAdmin } from "@/lib/admin";
import { demoBoardGuestbook } from "@/lib/demo";
import { getCloudName, thumbUrl } from "@/lib/cloudinary";
import GuestbookModItem, { type ModEntry } from "./GuestbookModItem";
import PhotoModCell from "./PhotoModCell";

export const dynamic = "force-dynamic";

type PhotoRow = { id: string; cloudinary_public_id: string; hidden: boolean };

export default async function AdminBoardPage() {
  const ctx = await requireAdmin();

  let entries: ModEntry[];
  let photos: PhotoRow[] = [];

  if (ctx.demo) {
    entries = demoBoardGuestbook();
  } else {
    const [entriesRes, photosRes] = await Promise.all([
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
    ]);
    entries = (entriesRes.data ?? []) as ModEntry[];
    photos = (photosRes.data ?? []) as PhotoRow[];
  }

  const cloudName = getCloudName();

  return (
    <>
      <div className="sec-title">
        <b>한 줄 노트 관리</b>
      </div>
      {entries.length === 0 && <p className="msg">아직 남긴 노트가 없어요.</p>}
      {entries.map((entry) => (
        <GuestbookModItem key={entry.id} entry={entry} />
      ))}

      <div className="sec-title mt-38">
        <b>갤러리 관리</b>
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
