"use client";

import { useState } from "react";
import { drawMyWordcard } from "@/app/actions/wordcard";

/**
 * 같은 말씀을 세 모양으로 — SNS에 올릴 정사각, 잠금화면에 걸 폰 배경, 뽑아
 * 둘 인쇄용. 그림은 모두 미리 그려 두었고 여기서는 고르기만 한다.
 */
const KINDS = [
  { key: "square", label: "SNS", dir: "", file: "정사각" },
  { key: "phone", label: "폰 배경", dir: "phone/", file: "폰배경" },
  { key: "print", label: "인쇄용", dir: "5x7/", file: "5x7" },
] as const;
type Kind = (typeof KINDS)[number];

/**
 * 말씀카드 — 뽑고, 보고, 저장한다.
 *
 * 뽑기 전에는 뒷면만 보인다. 카드가 이미 그려진 채로 놓여 있으면 「뽑는다」는
 * 말이 무색해진다 — 눌러서 받는 그 한 번이 이 카드의 전부다.
 *
 * 뽑고 나면 다시 물어보지 않는다. 새로고침해도, 다른 기기에서 열어도 같은
 * 장이 나온다 (어느 장을 받았는지는 사람마다 DB에 남는다).
 *
 * 그림은 미리 그려 둔 것을 그대로 쓴다. 화면에서 다시 그리면 인쇄한 카드와
 * 미묘하게 달라지는데, 같은 말씀을 받은 사람끼리 견주어 보면 그 차이가 먼저
 * 눈에 띈다.
 */
export default function WordcardDraw({
  initialSlug,
  preview = false,
}: {
  initialSlug: string | null;
  /** 비로그인 예시 화면 — 눌러도 뽑을 것이 없다 */
  preview?: boolean;
}) {
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [kind, setKind] = useState<Kind>(KINDS[0]);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function draw() {
    setDrawing(true);
    setFailed(false);
    const card = await drawMyWordcard();
    if (card) setSlug(card.slug);
    else setFailed(true);
    setDrawing(false);
  }

  async function save() {
    if (!slug) return;
    setSaving(true);
    try {
      // a[download]는 같은 출처의 파일에만 듣는다 — 받아서 넘겨준다
      const res = await fetch(`/wordcards/${kind.dir}${slug}.jpg`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `MIRACLE2026-말씀카드-${kind.file}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  if (!slug) {
    return (
      <div className="wcard-back">
        <div className="wc-eyebrow">WORD CARD</div>
        <p>
          한 사람에게 한 장씩,
          <br />
          올해의 말씀을 드립니다.
        </p>
        <button className="btn accent" disabled={drawing || preview} onClick={draw}>
          {drawing ? "뽑는 중…" : "말씀카드 뽑기"}
        </button>
        {failed && <p className="msg err">지금은 뽑을 수 없어요. 잠시 후 다시 해주세요.</p>}
      </div>
    );
  }

  return (
    <>
      {/* 모양 고르기 — 일정표의 요일 탭과 같은 생김새 */}
      <div className="day-tabs wc-kinds" role="tablist" aria-label="카드 모양">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            role="tab"
            aria-selected={kind.key === k.key}
            className={kind.key === k.key ? "on" : ""}
            onClick={() => setKind(k)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="wcard" data-kind={kind.key}>
        {/* 미리 그려 둔 카드 — next/image 미사용 (정적 파일 그대로) */}
        <img src={`/wordcards/${kind.dir}${slug}.jpg`} alt={`내 말씀카드 (${kind.label})`} />
      </div>
      <button className="btn wc-save" disabled={saving} onClick={save}>
        {saving ? "저장하는 중…" : `${kind.label} 카드 저장하기`}
      </button>
    </>
  );
}
