/** 라우트 전환 중 상단 진행바 — 전환이 시작됐다는 즉각적 피드백 */
export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-label="불러오는 중">
      <i />
    </div>
  );
}
