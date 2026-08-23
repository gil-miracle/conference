import NavAuth from "./NavAuth";
import { LockIcon } from "./icons";

export default function Nav({
  authed,
  isAdmin,
}: {
  authed: boolean;
  isAdmin: boolean;
}) {
  return (
    <nav className="site">
      <div className="nav-in">
        <a href="#top" className="nav-logo">
          MIRACLE
        </a>
        <a className="lnk" href="#about">
          About
        </a>
        <a className="lnk" href="#speakers">
          Speakers
        </a>
        <a className="lnk" href="#timetable">
          Timetable
        </a>
        <a className="lnk" href="#songs">
          Songs
        </a>
        <a className="lnk" href="#guestbook">
          방명록
        </a>
        <a className="lnk" href="#video">
          영상
        </a>
        <a className={`lnk${authed ? "" : " lock"}`} href="#my">
          {!authed && <LockIcon />}My
        </a>
        <a className={`lnk${authed ? "" : " lock"}`} href="#gallery">
          {!authed && <LockIcon />}갤러리
        </a>
        <NavAuth authed={authed} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
