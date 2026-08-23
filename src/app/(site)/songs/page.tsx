import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Playlist from "@/components/songs/Playlist";
import { SONGS } from "@/lib/content";

export const metadata: Metadata = { title: "송리스트 — MIRACLE 2026" };

export default function SongsPage() {
  return (
    <section>
      <div className="container">
        <PageHead
          title="송리스트"
          idx="SETLIST"
          lede="곡을 누르면 위에서 바로 재생돼요. 미리 듣고 오면 현장에서 더 깊이 예배할 수 있어요."
        />
        <Playlist songs={SONGS} />
      </div>
    </section>
  );
}
