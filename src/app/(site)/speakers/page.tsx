import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import SpeakerCard from "@/components/SpeakerCard";
import { SPEAKERS } from "@/lib/content";

export const metadata: Metadata = { title: "강사 소개 — MIRACLE 2026" };

export default function SpeakersPage() {
  return (
    <section>
      <div className="container">
        <PageHead
          title="강사 소개"
          idx="SPEAKERS"
          lede="카드를 누르면 약력과 담당 세션을 볼 수 있어요."
        />
        <div className="spk-grid reveal">
          {SPEAKERS.map((speaker) => (
            <Link key={speaker.id} href={`/speakers/${speaker.id}`} className="spk-link">
              <SpeakerCard speaker={speaker} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
