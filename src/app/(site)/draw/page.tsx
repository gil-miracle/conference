import type { Metadata } from "next";
import { Suspense } from "react";
import PageHead from "@/components/PageHead";
import DrawBack from "@/components/draw/DrawBack";
import DrawBoard from "@/components/draw/DrawBoard";

export const metadata: Metadata = { title: "나눔 순서 정하기 — MIRACLE 2026" };
export const revalidate = 3600;

export default function DrawPage() {
  return (
    <section>
      <div className="container">
        {/* ?from=2 로 들어왔으면 그 QT로 되돌아간다 (useSearchParams → Suspense) */}
        <Suspense fallback={null}>
          <DrawBack />
        </Suspense>
        <PageHead title="나눔 순서 정하기" />
        <DrawBoard />
      </div>
    </section>
  );
}
