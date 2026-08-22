import { THEME_VERSE } from "@/lib/content";

/** 정사각 말씀카드 — 좌측 이미지 기둥 + 우측 구절, FOR 참가자 이름 */
export default function WordCard({ name }: { name: string }) {
  return (
    <div className="wcard">
      <div className="img-col">
        <img src="/wordcard-bg.jpg" alt="" />
      </div>
      <div className="txt-col">
        <div className="wc-ref">{THEME_VERSE.refShort}</div>
        <p className="wc-verse">
          {THEME_VERSE.segments.map((seg, i) =>
            seg.b ? <b key={i}>{seg.t}</b> : <span key={i}>{seg.t}</span>
          )}
        </p>
        <div className="wc-foot">
          FOR {name}
          <br />
          MIRACLE 2026
        </div>
      </div>
    </div>
  );
}
