import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import NanumBoard from "@/components/nanum/NanumBoard";

export const metadata: Metadata = { title: "나눔 순서 — MIRACLE 2026" };
export const revalidate = 3600;

export default function NanumPage() {
  return (
    <section>
      <div className="container">
        <PageHead title="나눔 순서" />
        <NanumBoard />
      </div>
    </section>
  );
}
