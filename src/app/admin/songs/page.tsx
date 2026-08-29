import { requireAdmin } from "@/lib/admin";
import { getSongSets } from "@/lib/data/songs";
import { SONG_SETS_FALLBACK } from "@/lib/content";
import SongSetCard from "./SongSetCard";
import AddSetForm from "./AddSetForm";

export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const ctx = await requireAdmin();
  const sets = ctx.demo ? SONG_SETS_FALLBACK : await getSongSets();

  return (
    <>
      <div className="sec-title">
        <b>찬양리스트</b>
      </div>
      <p className="hint-text">
        집회별로 곡을 관리해요. YouTube는 주소를 그대로 붙여넣어도 영상 ID만 저장됩니다.
      </p>

      {sets.map((set) => (
        <SongSetCard key={set.id} set={set} demo={ctx.demo} />
      ))}

      {!ctx.demo && <AddSetForm />}
    </>
  );
}
