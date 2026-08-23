import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import GuestbookDelete from "@/components/guestbook/GuestbookDelete";
import GuestbookWriteCta from "@/components/guestbook/GuestbookWriteCta";
import { fmtDateTime } from "@/lib/format";
import { getGuestbook, getSiteContext } from "@/lib/data/site";

export const metadata: Metadata = { title: "방명록 — MIRACLE 2026" };
export const dynamic = "force-dynamic";

export default async function GuestbookPage() {
  const [ctx, entries] = await Promise.all([getSiteContext(), getGuestbook(30)]);
  const myId = ctx.summary?.id ?? null;

  return (
    <section id="guestbook">
      <div className="container">
        <PageHead
          title="방명록"
          idx="GUESTBOOK"
          lede="함께 나누고 싶은 기대와 기도를 남겨주세요."
        />
        <div className="reveal">
          {entries.length === 0 && (
            <p className="lede" style={{ padding: "10px 0 4px" }}>
              첫 번째 인사를 남겨주세요.
            </p>
          )}
          {entries.map((entry) => (
            <div className="gb" key={entry.id}>
              <div className="row">
                <b>{entry.display_name}</b>
                <time>{fmtDateTime(entry.created_at)}</time>
              </div>
              <p>{entry.content}</p>
              {myId && entry.participant_id === myId && <GuestbookDelete id={entry.id} />}
            </div>
          ))}
        </div>
        <div className="reveal">
          <GuestbookWriteCta
            open={ctx.guestbookOpen}
            authed={ctx.authed}
            bound={Boolean(ctx.summary)}
            myName={ctx.summary?.name ?? null}
          />
        </div>
      </div>
    </section>
  );
}
