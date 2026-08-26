import FlowHead from "./FlowHead";

/**
 * 상세 페이지 상단 — 메인의 흐름 제목(FlowHead)과 같은 모양을 쓴다.
 * 화면을 옮겨도 제목이 같은 자리에서 같은 크기로 나오게 하려는 것.
 */
export default function PageHead({
  title,
  lede,
}: {
  title: string;
  lede?: string;
}) {
  return (
    <>
      <FlowHead title={title} />
      {lede && <p className="lede reveal">{lede}</p>}
    </>
  );
}
