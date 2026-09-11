import Link from "next/link";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import ChapterReader from "@/components/reading/ChapterReader";
import { READING_TRANSLATION, getQtReading } from "@/lib/bible";
import type { TimetableDay } from "@/lib/types";

/**
 * 아침 QT 한 화면 — 본문 · 묵상 · 기도.
 *
 * 본문이 여러 장짜리 통독인 날(셋째 날 역대상 1~3장)은 마가복음 통독 화면처럼
 * 한 장씩 보이고 좌우로 넘긴다. 장은 주소에 둔다(/qt/3/2) — 물음표 뒤에
 * 두면 정적 렌더링에서 빠져 본문이 HTML에 실리지 않는다. 묵상·기도는 어느
 * 장에서나 아래에 같이 선다.
 *
 * 묵상 질문은 조 모임에서 그대로 읽어 쓸 수 있게 완결된 문장으로 적는다.
 */
export default function QtView({
  found,
  chapter,
}: {
  found: TimetableDay & { qt: NonNullable<TimetableDay["qt"]> };
  /** 통독인 날의 장 — 없으면 첫 장 */
  chapter?: number;
}) {
  const { qt } = found;
  const reading = getQtReading(found.day);
  const at = chapter ?? reading?.chapters[0]?.n;

  return (
    <section>
      <div className="container">
        <BackLink href={`/timetable/${found.day}`}>
          {found.label} 일정
        </BackLink>

        <PageHead
          title={`${found.date} QT`}
          action={
            <Link className="head-action" href={`/draw?from=${found.day}`}>
              나눔 순서 정하기
            </Link>
          }
        />

        <div className="qt-head reveal">
          <h3>{qt.passage}</h3>
          {qt.theme && <p className="qt-theme">{qt.theme}</p>}
        </div>

        {reading && at !== undefined ? (
          <div className="reveal">
            <ChapterReader
              book={reading.book}
              translation={READING_TRANSLATION}
              chapters={reading.chapters}
              initial={at}
              base={`/qt/${found.day}`}
            />
          </div>
        ) : (
          <>
            <blockquote className="spk-verse reveal">
              {qt.verses.map((v) => (
                <p className="v" key={v.n}>
                  <b className="vn">{v.n}</b>
                  {v.text}
                </p>
              ))}
              <cite>{qt.passage} · {READING_TRANSLATION}</cite>
            </blockquote>
            {/* 전문을 다 실을 수 없는 날이 있다 — 줄였다면 그 사실을 적는다 */}
            {qt.note && <p className="qt-note reveal">{qt.note}</p>}
          </>
        )}

        <div className="sub-head reveal">
          <h3>묵상</h3>
        </div>
        <ol className="qt-reflect reveal">
          {qt.reflect.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>

        <div className="sub-head reveal">
          <h3>기도</h3>
        </div>
        <p className="qt-pray reveal">{qt.pray}</p>
      </div>
    </section>
  );
}
