/** 섹션 공통 헤더 — 제목 + 우측 인덱스 라벨 */
export default function SectionHead({
  title,
  idx,
}: {
  title: string;
  idx: string;
}) {
  return (
    <div className="sec-head reveal">
      <h2>{title}</h2>
      <span className="idx">{idx}</span>
    </div>
  );
}
