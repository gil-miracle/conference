"use client";

import { useEffect, useState } from "react";
import { drawMyWordcard } from "@/app/actions/wordcard";

/**
 * 같은 말씀을 세 모양으로 — SNS에 올릴 정사각, 인화할 5x7, 잠금화면에 걸
 * 폰 배경. 그림은 모두 미리 그려 두었고 여기서는 고르기만 한다.
 */
const KINDS = [
  { key: "square", label: "정사각", dir: "", file: "정사각" },
  { key: "print", label: "5x7", dir: "5x7/", file: "5x7" },
  { key: "phone", label: "폰배경", dir: "phone/", file: "폰배경" },
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
  /* 세 모양의 그림 파일을 처음에 다 받아 둔다. iOS는 공유 시트를 「누른 그
     순간」에만 열어 줘서 누른 뒤에 받아 오면 늦고, 탭을 오갈 때마다 받으면
     그 사이 단추가 꺼졌다 켜지며 깜빡인다 */
  const [blobs, setBlobs] = useState<Partial<Record<Kind["key"], Blob>>>({});
  useEffect(() => {
    if (!slug) return;
    let gone = false;
    for (const k of KINDS) {
      fetch(`/wordcards/${k.dir}${slug}.jpg`)
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => {
          if (!gone && b) setBlobs((prev) => ({ ...prev, [k.key]: b }));
        })
        .catch(() => {});
    }
    return () => {
      gone = true;
    };
  }, [slug]);
  const blob = blobs[kind.key] ?? null;

  async function draw() {
    setDrawing(true);
    setFailed(false);
    const card = await drawMyWordcard();
    if (card) setSlug(card.slug);
    else setFailed(true);
    setDrawing(false);
  }

  async function save() {
    if (!slug || !blob) return;
    setSaving(true);
    setFailed(false);
    const name = `MIRACLE2026-말씀카드-${kind.file}.jpg`;
    try {
      /*
       * 폰에서는 공유 시트로 넘긴다 — 거기 「이미지 저장」이 있다.
       * a[download]는 iOS에서 사진 앱이 아니라 파일 내려받기 화면으로 가서,
       * 받은 사람이 어디 갔는지 모른다. 공유를 못 여는 브라우저(데스크톱)만
       * 예전처럼 파일로 내려준다.
       */
      const file = new File([blob], name, { type: "image/jpeg" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      // 시트를 그냥 닫은 것은 실패가 아니다
      if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
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
      {/* 세 그림을 다 올려 두고 보이는 것만 바꾼다 — src를 갈아 끼우면 새 그림이
          올 때까지 빈 칸이 번쩍인다. 미리 그려 둔 파일이라 next/image는 안 쓴다 */}
      {KINDS.map((k) => (
        <div key={k.key} className="wcard" data-kind={k.key} hidden={k.key !== kind.key}>
          <img src={`/wordcards/${k.dir}${slug}.jpg`} alt={`내 말씀카드 (${k.label})`} />
        </div>
      ))}
      <button className="btn wc-save" disabled={saving || !blob} onClick={save}>
        {saving ? "저장하는 중…" : `${kind.label} 카드 저장하기`}
      </button>
      {failed && (
        <p className="msg err">저장이 안 되면 그림을 길게 눌러 「사진에 저장」을 골라 주세요.</p>
      )}
    </>
  );
}
