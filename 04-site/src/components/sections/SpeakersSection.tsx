import SectionHead from "@/components/SectionHead";
import SpeakerCard from "@/components/SpeakerCard";
import { SPEAKERS } from "@/lib/content";

export default function SpeakersSection() {
  return (
    <section id="speakers">
      <div className="container">
        <SectionHead title="강사 소개" idx="02 — SPEAKERS" />
        <div className="spk-grid reveal">
          {SPEAKERS.map((speaker) => (
            <SpeakerCard key={speaker.name} speaker={speaker} />
          ))}
        </div>
      </div>
    </section>
  );
}
