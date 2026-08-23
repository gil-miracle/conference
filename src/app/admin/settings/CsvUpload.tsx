"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseParticipantsCsv, type ParticipantCsvRow } from "@/lib/csv";
import { upsertParticipants } from "../actions/participants";

/**
 * 명단 CSV 업로드 — 엑셀에서 "CSV(쉼표로 분리)"로 저장한 파일 또는 붙여넣기.
 * 형식: 이름,생년월일,전화번호
 */
export default function CsvUpload({ demo }: { demo: boolean }) {
  const [preview, setPreview] = useState<{
    rows: ParticipantCsvRow[];
    skipped: number;
  } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleText = (text: string) => {
    setResult(null);
    setPreview(parseParticipantsCsv(text));
  };

  const submit = () => {
    if (!preview || preview.rows.length === 0) return;
    startTransition(async () => {
      const res = await upsertParticipants(preview.rows);
      setResult(res);
      if (res.ok) {
        setPreview(null);
        setPasteText("");
        router.refresh();
      }
    });
  };

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>참가자 명단</b>
          <small>CSV 업로드로 명단 추가·갱신 (이름,생년월일,전화번호)</small>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          handleText(await file.text());
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          className="btn ghost"
          style={{ flex: 1 }}
          disabled={demo}
          onClick={() => fileRef.current?.click()}
        >
          CSV 업로드
        </button>
        <button
          className="btn ghost"
          style={{ flex: 1 }}
          disabled={demo}
          onClick={() => setPasteMode(!pasteMode)}
        >
          붙여넣기
        </button>
        <a
          className="btn ghost"
          style={{ flex: 1, textAlign: "center" }}
          href="/api/admin/export"
        >
          다운로드
        </a>
      </div>

      {pasteMode && (
        <>
          <textarea
            placeholder={
              "김예찬,19940101,010-1234-5678\n이요셉,19920302,010-2222-1234"
            }
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button
            className="btn sm ghost"
            style={{ marginTop: 8 }}
            onClick={() => handleText(pasteText)}
          >
            확인
          </button>
        </>
      )}

      {preview && (
        <div className="msg" style={{ marginTop: 14 }}>
          {preview.rows.length}명 인식
          {preview.skipped > 0 ? ` · ${preview.skipped}행 건너뜀` : ""}
          {preview.rows.length > 0 && (
            <>
              {" — "}
              {preview.rows
                .slice(0, 3)
                .map((r) => r.name)
                .join(", ")}
              {preview.rows.length > 3 ? " …" : ""}
              <button
                className="btn sm accent"
                style={{ display: "block", marginTop: 10 }}
                disabled={pending}
                onClick={submit}
              >
                {pending ? "저장 중…" : `${preview.rows.length}명 저장하기`}
              </button>
            </>
          )}
        </div>
      )}
      {result && (
        <p className={`msg ${result.ok ? "ok" : "err"}`}>{result.message}</p>
      )}
      <small style={{ marginTop: 12 }}>
        같은 이름+생년월일+전화번호는 갱신, 새 조합은 추가돼요. 기존
        체크인·바인딩은 유지됩니다.
      </small>
    </div>
  );
}
