/**
 * 메인 흐름 섹션의 제목 — 이탤릭 세리프 한 단어 + 오른쪽으로 뻗는 얇은 선.
 * 굵은 국문 대제목 대신 가볍게 얹어 흐름을 끊지 않는다.
 */
export default function FlowHead({ title }: { title: string }) {
  return (
    <div className="flow-head reveal">
      <h2>{title}</h2>
      <span className="rule" aria-hidden="true" />
    </div>
  );
}
