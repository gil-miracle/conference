"use client";

import { useState } from "react";
import { downloadBlob, renderWordcardPng } from "@/lib/wordcard";

export default function WordcardSave({ name }: { name: string }) {
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const blob = await renderWordcardPng(name);
      downloadBlob(blob, `MIRACLE2026-말씀카드-${name}.png`);
    } catch {
      alert("이미지 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn wc-save" onClick={save} disabled={busy}>
      {busy ? "만드는 중…" : "말씀카드 저장하기"}
    </button>
  );
}
