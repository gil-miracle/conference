import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import GuestbookDelete from "@/components/guestbook/GuestbookDelete";
import GuestbookWriteCta from "@/components/guestbook/GuestbookWriteCta";
import { fmtDateTime } from "@/lib/format";
import { getGuestbook } from "@/lib/data/site";

export const metadata: Metadata = { title: "방명록 — MIRACLE 2026" };
export const revalidate = 30;

export default async function GuestbookPage() {
  const entries = await getGuestbook(30);

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
            <p className="lede empty-note">첫 번째 인사를 남겨주세요.</p>
          )}
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
        <div className="reveal">
          <GuestbookWriteCta />
        </div>
      </div>
    </section>
  );
}
