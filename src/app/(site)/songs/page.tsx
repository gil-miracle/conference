import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Playlist from "@/components/songs/Playlist";
import { getSongSets } from "@/lib/data/songs";

export const metadata: Metadata = { title: "찬양리스트 — MIRACLE 2026" };
/** 관리자 수정 시 revalidatePath로 즉시 갱신되므로 짧게 캐시해도 안전 */
export const revalidate = 60;

export default async function SongsPage() {
  const sets = await getSongSets();

  return (
    <section>
      <div className="container">
        <PageHead title="찬양리스트" />
        <Playlist sets={sets} />
      </div>
    </section>
  );
}
