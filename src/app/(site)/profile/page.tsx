import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import ConnectPrompt from "@/components/profile/ConnectPrompt";
import PendingCard from "@/components/profile/PendingCard";
import PreviewNotice from "@/components/profile/PreviewNotice";
import WordcardDraw from "@/components/profile/WordcardDraw";
import RoomCard from "@/components/profile/RoomCard";
import TeamCard from "@/components/profile/TeamCard";
import QrCard from "@/components/profile/QrCard";
import { MY_PREVIEW } from "@/lib/demo";
import { getSiteContext } from "@/lib/data/site";
import { getSupabaseServer } from "@/lib/supabase/server";

/** 내 티셔츠 크기 한 칸 — 체크인한 사람에게만 필요하다 */
async function myTshirt(participantId: string | null): Promise<string | null> {
  if (!participantId) return null;
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("participants")
    .select("tshirt")
    .eq("id", participantId)
    .maybeSingle();
  return data?.tshirt ?? null;
}

export const metadata: Metadata = { title: "내 정보 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // ?demo=1 — 목업 단계에서 로그인 후 화면을 바로 보는 미리보기 링크
  const { demo } = await searchParams;
  const ctx = await getSiteContext(demo === "1");
  const summary = ctx.summary;
  // 티셔츠 크기는 요약 RPC에 없다 — 체크인 뒤 완료 카드에서만 쓰는 한 칸이라
  // 그때만 내 줄에서 읽는다 (participants_select_own)
  const tshirt = await myTshirt(summary?.checked_in_at ? summary.id : null);
  const menus = ctx.menus;

  // 비로그인 방문자에게는 예시 화면을 보여준다 — 잠긴 화면만 띄우면
  // "로그인하면 뭐가 나오는지"를 알 수 없어 연결까지 가지 않는다.
  if (!ctx.authed) {
    return (
      <section id="my">
        <div className="container">
          <PageHead title="내 정보" />
          <PreviewNotice />
          <div className="reveal" aria-hidden="true">
            {/* 안 쓸 카드는 예시에서도 뺀다 — 로그인하면 나올 것처럼 보이면 안 된다 */}
            {menus.room && <RoomCard room={MY_PREVIEW.room} mates={MY_PREVIEW.mates} open />}
            {menus.team && <TeamCard team={MY_PREVIEW.team} open />}
            {menus.wordcard && <WordcardDraw initialSlug={null} preview />}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="my">
      <div className="container">
        <PageHead title="내 정보" />
        {!summary ? (
          <ConnectPrompt />
        ) : summary.status !== "approved" ? (
          <PendingCard summary={summary} />
        ) : (
          <div className="reveal">
            {/* 체크인 데스크에서 제일 먼저 여는 화면이다 — QR이 맨 위.
                체크인되면 같은 자리가 「체크인 완료 · 티셔츠 크기」로 바뀐다 —
                데스크가 티셔츠를 건네며 화면을 보고, 참가자도 됐다는 것을 안다 */}
            {summary.checkin_token && (
              <QrCard
                token={summary.checkin_token}
                checkedInAt={summary.checked_in_at}
                tshirt={tshirt}
              />
            )}
            {/* 체크인 전에는 QR만 둔다. 숙소·조·말씀카드는 데스크를 지난 뒤의
                일이라, 그 전에 보이면 "내 건 왜 없지"가 데스크 앞에서 나온다.
                체크인되면 QR 카드가 서버 화면을 다시 받아 여기가 함께 열린다.
                (2026-09-11 결정)
                공개 전에도 자리는 둔다 — 아예 안 쓰기로 한 카드는 설정에서 끈다.
                배정 공개(rooms_open)와 카드 노출은 다른 판단이다 */}
            {summary.checked_in_at && (
              <>
                {menus.room && (
                  <RoomCard
                    room={summary.room}
                    mates={summary.mates}
                    open={summary.rooms_open === true}
                  />
                )}
                {menus.team && (
                  <TeamCard team={summary.team} open={summary.teams_open === true} />
                )}
                {/* 한 사람에게 한 장 — 뽑기 전에는 뒷면만 보인다 */}
                {menus.wordcard && <WordcardDraw initialSlug={summary.wordcard ?? null} />}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
