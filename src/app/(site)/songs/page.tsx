import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Playlist from "@/components/songs/Playlist";
import { getSongSets } from "@/lib/data/songs";

export const metadata: Metadata = { title: "송리스트 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const sets = await getSongSets();

  return (
    <section>
      <div className="container">
        <PageHead
          title="송리스트"
          idx="SETLIST"
          lede="집회를 고르고 곡을 누르면 위에서 바로 재생돼요. 미리 듣고 오면 현장에서 더 깊이 예배할 수 있어요."
        />
        <Playlist sets={sets} />
      </div>
    </section>
  );
}
