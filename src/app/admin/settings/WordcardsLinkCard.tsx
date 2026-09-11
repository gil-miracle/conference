import Link from "next/link";

/** 말씀카드 배부 현황으로 가는 길 — 화면은 따로 있다. 40장을 여기 다 펼치면 설정이 길어진다 */
export default function WordcardsLinkCard({ drawn, total }: { drawn: number; total: number }) {
  return (
    <div className="set">
      <div className="row">
        <div>
          <b>말씀카드 배부 현황</b>
          <small>
            {total}장 중 {drawn}장이 나갔어요. 어느 장이 누구에게 갔는지 봅니다.
          </small>
        </div>
        <Link className="btn sm" href="/admin/wordcards">
          보기
        </Link>
      </div>
    </div>
  );
}
