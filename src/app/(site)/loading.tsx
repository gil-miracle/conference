/**
 * 화면을 옮기는 동안 보이는 자리.
 *
 * 로그인해야 보이는 화면(멘토의 TMI·한 줄 노트·갤러리·조 점수·내 정보)은
 * 서버가 매번 그린다. 이게 없으면 탭을 눌러도 답이 올 때까지 아무 일도 없어
 * 「눌렸나?」 하고 다시 누른다. 정적인 화면은 미리 받아 두므로 여기를 거의
 * 거치지 않는다.
 */
export default function SiteLoading() {
  return (
    <section aria-busy="true">
      <div className="container">
        <p className="page-loading">LOADING…</p>
      </div>
    </section>
  );
}
