import type { Metadata } from "next";
import { Suspense } from "react";
import PageHead from "@/components/PageHead";
import NanumBack from "@/components/nanum/NanumBack";
import NanumBoard from "@/components/nanum/NanumBoard";

export const metadata: Metadata = { title: "나눔 순서 — MIRACLE 2026" };
export const revalidate = 3600;

export default function NanumPage() {
  return (
    <section>
      <div className="container">
        {/* ?from=2 로 들어왔으면 그 QT로 되돌아간다 (useSearchParams → Suspense) */}
        <Suspense fallback={null}>
          <NanumBack />
        </Suspense>
        <PageHead title="나눔 순서" />
        <NanumBoard />
      </div>
    </section>
  );
}
