import { fmtDateTime } from "@/lib/format";
import ModButtons from "./ModButtons";

export type ModEntry = {
  id: string;
  display_name: string;
  content: string;
  hidden: boolean;
  created_at: string;
};

export default function GuestbookModItem({ entry }: { entry: ModEntry }) {
  return (
    <div className={`mod${entry.hidden ? " dim" : ""}`}>
      <div className="row">
        <b>{entry.display_name}</b>
        <time>
          {fmtDateTime(entry.created_at)}
          {entry.hidden ? " · 숨김됨" : ""}
        </time>
      </div>
      <p>{entry.content}</p>
      <ModButtons id={entry.id} hidden={entry.hidden} />
    </div>
  );
}
