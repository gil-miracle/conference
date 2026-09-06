import FlowHead from "./FlowHead";

/**
 * 상세 페이지 상단 — 메인의 흐름 제목(FlowHead)과 같은 모양을 쓴다.
 * 화면을 옮겨도 제목이 같은 자리에서 같은 크기로 나오게 하려는 것.
 */
export default function PageHead({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <>
      <FlowHead title={title} action={action} />
      {/* keep-lines — 문장을 나눠 적은 설명은 적은 대로 접힌다.
          개행이 없는 글에는 아무 일도 일어나지 않는다 */}
      {lede && <p className="lede reveal keep-lines">{lede}</p>}
    </>
  );
}
