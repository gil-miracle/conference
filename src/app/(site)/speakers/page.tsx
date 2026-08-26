import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import SpeakerCard from "@/components/SpeakerCard";
import { SPEAKERS } from "@/lib/content";

export const metadata: Metadata = { title: "설교자 — MIRACLE 2026" };
/** 콘텐츠가 코드에서만 오므로 매 요청 렌더링할 필요가 없다 */
export const revalidate = 3600;

export default function SpeakersPage() {
  return (
    <section>
      <div className="container">
        <PageHead
          title="설교자"
          lede="카드를 누르면 소속과 담당 세션을 볼 수 있어요."
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
