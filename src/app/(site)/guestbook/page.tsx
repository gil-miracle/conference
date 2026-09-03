import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import GuestbookDelete from "@/components/guestbook/GuestbookDelete";
import GuestbookWriteCta from "@/components/guestbook/GuestbookWriteCta";
import { fmtDateTime } from "@/lib/format";
import Locked from "@/components/Locked";
import { TabIcon } from "@/components/nav/TabIcons";
import { getGuestbook, getSiteContext } from "@/lib/data/site";

export const metadata: Metadata = { title: "방명록 — MIRACLE 2026" };
// 로그인 여부에 따라 내용이 갈리므로 캐시하지 않는다
export const dynamic = "force-dynamic";

export default async function GuestbookPage() {
  const ctx = await getSiteContext();
  const entries = ctx.authed ? await getGuestbook(30) : [];

  return (
    <section id="guestbook">
      <div className="container">
        <PageHead
          title="방명록"
          lede="함께 나누고 싶은 기대와 기도를 남겨주세요."
        />
        {!ctx.authed ? (
          <Locked icon={<TabIcon name="pen" />} showLogin>
            기도제목이 오가는 자리라 로그인한 분만 읽을 수 있어요.
          </Locked>
        ) : (
          <>
            {/* 글보다 위에 둔다 — 밑에 두면 방명록이 쌓일수록
                쓰러 온 사람이 끝까지 스크롤해야 버튼을 만난다 */}
            <div className="reveal">
              <GuestbookWriteCta />
            </div>
            <div className="reveal">
              {entries.map((entry) => (
                <div className="gb" key={entry.id}>
                  <div className="row">
                    <b>{entry.display_name}</b>
                    <time>{fmtDateTime(entry.created_at)}</time>
                  </div>
                  <p>{entry.content}</p>
                  <GuestbookDelete id={entry.id} ownerId={entry.participant_id} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
