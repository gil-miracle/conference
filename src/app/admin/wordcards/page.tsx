import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "말씀카드 배부 — MIRACLE ADMIN" };
export const dynamic = "force-dynamic";

type Card = { id: string; sort: number; slug: string; ref_en: string; body: string };
type Holder = {
  id: string;
  name: string;
  wordcard: string;
  wordcard_drawn_at: string | null;
  applicant_type: string | null;
};

/**
 * 말씀카드 배부 현황 — 40장이 각각 누구에게 갔는지.
 *
 * 뽑기는 「안 나간 장 → 가장 적게 나간 장」 순이라, 다 나간 뒤에는 한 장을
 * 둘이 받는다. 어느 장이 몇 명에게 갔는지가 보여야 「나만 겹쳤다」는 말에
 * 답할 수 있다. 개인별 초기화는 참가자 상세에서 한다 — 여기서는 보기만.
 */
export default async function AdminWordcardsPage() {
  const ctx = await requireAdmin();

  let cards: Card[] = [];
  let holders: Holder[] = [];
  if (!ctx.demo) {
    const [cardsRes, holdersRes] = await Promise.all([
      ctx.supabase.from("wordcards").select("id,sort,slug,ref_en,body").order("sort"),
      ctx.supabase
        .from("participants")
        .select("id,name,wordcard,wordcard_drawn_at,applicant_type")
        .not("wordcard", "is", null)
        .order("wordcard_drawn_at"),
    ]);
    cards = (cardsRes.data ?? []) as Card[];
    holders = (holdersRes.data ?? []) as Holder[];
  }

  const byCard = new Map<string, Holder[]>();
  for (const h of holders) {
    const list = byCard.get(h.wordcard) ?? [];
    list.push(h);
    byCard.set(h.wordcard, list);
  }
  const drawnCards = cards.filter((c) => byCard.has(c.id)).length;

  return (
    <>
      <div className="sec-title">
        <b>말씀카드 배부 현황</b>
        <Link className="btn sm ghost sec-add" href="/admin/settings">
          설정으로
        </Link>
      </div>
      <p className="upd">
        {cards.length}장 중 {drawnCards}장 나감 · 뽑은 사람 {holders.length}명
      </p>

      {cards.length === 0 ? (
        <div className="feed">
          <div className="row empty">
            {ctx.demo ? "미리보기 모드에는 카드 목록이 없어요." : "카드 목록을 불러오지 못했어요."}
          </div>
        </div>
      ) : (
        <ol className="wc-list">
          {cards.map((c) => {
            const people = byCard.get(c.id) ?? [];
            return (
              <li key={c.id} className={people.length === 0 ? "none" : undefined}>
                {/* 사이트가 쓰는 정사각 그림 그대로 — 여기 따로 굽지 않는다 */}
                <img src={`/wordcards/${c.slug}.jpg`} alt="" loading="lazy" />
                <div className="wc-body">
                  <div className="wc-ref">
                    <span>{c.ref_en}</span>
                    <em>{people.length === 0 ? "아직 없음" : `${people.length}명`}</em>
                  </div>
                  <p className="wc-text">{c.body}</p>
                  {people.length > 0 && (
                    <div className="wc-people">
                      {people.map((p) => (
                        <span
                          className="chip"
                          key={p.id}
                          title={p.wordcard_drawn_at ? fmtDateTime(p.wordcard_drawn_at) : undefined}
                        >
                          {p.name}
                          {p.applicant_type === "교역자" || p.applicant_type === "멘토"
                            ? ` · ${p.applicant_type}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
