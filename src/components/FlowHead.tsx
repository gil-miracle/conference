/**
 * 메인 흐름 섹션의 제목 — 제목 + 오른쪽으로 뻗는 얇은 선.
 * 굵은 국문 대제목 대신 가볍게 얹어 흐름을 끊지 않는다.
 * `action`을 주면 선 오른쪽 끝에 버튼·링크가 붙는다.
 */
export default function FlowHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flow-head reveal">
      <h2>{title}</h2>
      <span className="rule" aria-hidden="true" />
      {action}
    </div>
  );
}
