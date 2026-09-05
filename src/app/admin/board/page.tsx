import { requireAdmin } from "@/lib/admin";
import { demoBoardGuestbook } from "@/lib/demo";
import { getCloudName } from "@/lib/cloudinary";
import GuestbookModItem, { type ModEntry } from "./GuestbookModItem";
import GalleryPanel from "./GalleryPanel";

export const dynamic = "force-dynamic";

import type { Photo } from "@/lib/types";

export default async function AdminBoardPage() {
  const ctx = await requireAdmin();

  let entries: ModEntry[];
  let photos: Photo[] = [];

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
        .select(
          "id,participant_id,cloudinary_public_id,width,height,hidden,sort_order,created_at"
        )
        // 참가자가 보는 것과 같은 차례로 늘어놓는다 — 끌어서 고치는 자리라
        // 여기서 보이는 순서가 곧 저기서 보이는 순서여야 한다
        .order("sort_order", { ascending: true })
        .limit(500),
    ]);
    entries = (entriesRes.data ?? []) as ModEntry[];
    photos = (photosRes.data ?? []) as Photo[];
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

      <GalleryPanel initial={photos} cloudName={cloudName} demo={ctx.demo} />
    </>
  );
}
