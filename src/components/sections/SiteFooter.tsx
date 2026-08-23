import { EVENT } from "@/lib/content";

export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="container">
        <div className="disp">MIRACLE</div>
        <p>
          {EVENT.subtitle}
          <br />
          {EVENT.dateLabel} · {EVENT.venue}
        </p>
        <div className="rule">© GIL COMMUNITY. ALL RIGHTS RESERVED.</div>
      </div>
    </footer>
  );
}
