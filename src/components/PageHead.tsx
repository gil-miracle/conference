/** 상세 페이지 상단 타이틀 블록 */
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
      <div className="sec-head reveal">
        <h2>{title}</h2>
        <span className="idx">{idx}</span>
      </div>
      {lede && <p className="lede reveal">{lede}</p>}
    </>
  );
}
