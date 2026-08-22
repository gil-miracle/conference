import SectionHead from "@/components/SectionHead";
import GuestbookDelete from "@/components/guestbook/GuestbookDelete";
import GuestbookWriteCta from "@/components/guestbook/GuestbookWriteCta";
import { fmtDateTime } from "@/lib/format";
import type { GuestbookEntry } from "@/lib/types";

export default function GuestbookSection({
  entries,
  authed,
  bound,
  open,
  myParticipantId,
  myName,
}: {
  entries: GuestbookEntry[];
  authed: boolean;
  bound: boolean;
  open: boolean;
  myParticipantId: string | null;
  myName: string | null;
}) {
  return (
    <section id="guestbook">
      <div className="container">
        <SectionHead title="방명록" idx="05 — GUESTBOOK" />
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
              {myParticipantId && entry.participant_id === myParticipantId && (
                <GuestbookDelete id={entry.id} />
              )}
            </div>
          ))}
        </div>
        <div className="reveal">
          <GuestbookWriteCta
            open={open}
            authed={authed}
            bound={bound}
            myName={myName}
          />
        </div>
      </div>
    </section>
  );
}
