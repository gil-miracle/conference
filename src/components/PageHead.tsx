import SectionHead from "./SectionHead";

/** 상세 페이지 상단 타이틀 블록 — 섹션 헤더 + 리드 문단 */
export default function PageHead({
  title,
  idx,
  lede,
}: {
  title: string;
  idx: string;
  lede?: string;
}) {
  return (
    <>
      <SectionHead title={title} idx={idx} />
      {lede && <p className="lede reveal">{lede}</p>}
    </>
  );
}
