"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 장 이동.
 *
 * 꺾쇠로 한 장씩 넘기는 것만으로는 7장에서 2장으로 갈 때 다섯 번을 눌러야
 * 한다. 가운데 제목을 누르면 장 목록이 열린다 — 폰에서는 운영체제가 그리는
 * 고르개가 뜨므로 우리가 목록을 그려 넣는 것보다 손에 익다.
 *
 * 고르개는 제목 위에 투명하게 덮어 둔다. 보이는 글자는 우리가 그린 것이고,
 * 눌리는 것은 그 아래 select다 — 네이티브 고르개의 편함과 우리 생김새를
 * 함께 가져가는 흔한 방법이다.
 */
export default function ChapterNav({
  book,
  chapters,
  at,
  place,
  base = "/reading",
  onPick,
}: {
  book: string;
  chapters: readonly number[];
  at: number;
  place: "top" | "bottom";
  /** 장 주소 앞머리 — 통독은 /reading, 셋째 날 QT는 /qt/3 */
  base?: string;
  /**
   * 있으면 화면을 옮기지 않고 이것을 부른다 — 장을 다 그려 둔 화면(ChapterReader)
   * 에서 본문만 바꿀 때. 없으면 꺾쇠가 링크라 그 장 주소로 간다
   */
  onPick?: (n: number) => void;
}) {
  const router = useRouter();
  const i = chapters.indexOf(at);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  const pick = (n: number) => (onPick ? onPick(n) : router.push(`${base}/${n}`));

  const arrow = (n: number | undefined, dir: "left" | "right") =>
    !n ? (
      <span className="ch-arrow off" aria-hidden="true">
        <Chevron dir={dir} />
      </span>
    ) : onPick ? (
      <button type="button" className="ch-arrow" aria-label={`${n}장`} onClick={() => onPick(n)}>
        <Chevron dir={dir} />
      </button>
    ) : (
      <Link className="ch-arrow" href={`${base}/${n}`} aria-label={`${n}장`}>
        <Chevron dir={dir} />
      </Link>
    );

  return (
    <nav className={`ch-nav ${place}`} aria-label="장 이동">
      {/* 첫 장·끝 장에서도 자리는 남긴다 — 사라지면 제목이 좌우로 흔들린다 */}
      {arrow(prev, "left")}
      <div className="ch-pick">
        <b>
          {book} {at}장
        </b>
        <Chevron dir="down" />
        <select
          aria-label="장 고르기"
          value={at}
          onChange={(e) => pick(Number(e.target.value))}
        >
          {chapters.map((c) => (
            <option key={c} value={c}>
              {book} {c}장
            </option>
          ))}
        </select>
      </div>

      {arrow(next, "right")}
    </nav>
  );
}

function Chevron({ dir }: { dir: "left" | "right" | "down" }) {
  const d =
    dir === "left" ? "M15 5 8 12l7 7" : dir === "right" ? "M9 5l7 7-7 7" : "M6 9l6 6 6-6";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
