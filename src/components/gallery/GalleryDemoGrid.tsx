/** 미리보기 모드 — 목업 v10의 그라데이션 자리 채움 그리드 */
export default function GalleryDemoGrid() {
  return (
    <div className="reveal">
      <div className="gal-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div className="cell demo" key={i} />
        ))}
      </div>
      <div className="center mt-30">
        <button className="btn accent" disabled>
          사진 올리기
        </button>
        <p className="msg mt-14">
          미리보기 모드 — 실서비스에선 참가자들이 올린 사진이 여기에 채워져요.
        </p>
      </div>
    </div>
  );
}
