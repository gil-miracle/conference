import type { Metadata } from "next";
import { Suspense } from "react";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import ChapterReader from "@/components/reading/ChapterReader";
import { READING_BOOK, READING_CHAPTERS, getChapter } from "@/lib/bible";

export const metadata: Metadata = {
  title: `${READING_BOOK} 통독 — MIRACLE 2026`,
};
/** 본문이 코드에서만 오므로 매 요청 렌더링할 필요가 없다 */
export const revalidate = 3600;

/**
 * 성경 통독 — MIRACLE 2, 조영찬 전도사님 시간.
 *
 * 열한 장을 한 화면에 다 쏟으면 어디를 읽는 중인지 잃는다. 한 장씩 보여주고
 * 꺾쇠로 넘긴다.
 */
export default function ReadingPage() {
  const chapters = READING_CHAPTERS.map((n) => getChapter(n)).filter(
    (c) => c !== null
  );

  return (
    <section id="reading">
      <div className="container">
        <BackLink href="/timetable?day=2">9.12 (토) 일정</BackLink>

        <PageHead
          title={`${READING_BOOK} 통독`}
          lede={`${READING_BOOK} 1~11장을 함께 읽어요.`}
        />

        {/* useSearchParams(?ch=)를 쓰므로 Suspense가 필요하다.
            대신 페이지는 계속 정적으로 남는다. */}
        <Suspense fallback={null}>
          <ChapterReader chapters={chapters} />
        </Suspense>
      </div>
    </section>
  );
}
