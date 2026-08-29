"use client";

import { useState } from "react";
import { useConfirm } from "@/components/Confirm";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import {
  removeParticipant,
  syncParticipantsFromSheet,
  type SheetSyncResult,
} from "../actions/sheet";

/**
 * 구글 시트 동기화 — 버튼 한 번으로 시트의 명단을 DB에 반영한다.
 *
 * 시트에서 빠진 사람은 지우지 않고 목록으로만 보여준다. 체크인·숙소 배정이
 * 딸린 사람을 실수로 날리지 않도록, 지우는 건 한 명씩 눌러 결정하게 한다.
 */
export default function SheetSync() {
  const [result, setResult] = useState<SheetSyncResult | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const { pending, run } = useServerAction();
  const confirm = useConfirm();
  const demo = useAdminDemo();

  const sync = () =>
    run(async () => {
      setGone([]);
      setResult(await syncParticipantsFromSheet());
    });

  const drop = async (id: string, name: string) => {
    const ok = await confirm({
      message: `${name} 님을 명단에서 지울까요? 배정·체크인 기록도 함께 사라져요.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    const res = await removeParticipant(id);
    if (res.ok) setGone((prev) => [...prev, id]);
  };

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>참가자 명단</b>
          <small>구글 시트를 읽어 명단을 맞춥니다 (이름·생년월일·전화번호)</small>
        </div>
      </div>

      <div className="btn-row mt-14">
        <button className="btn accent" disabled={demo || pending} onClick={sync}>
          {pending ? "동기화 중…" : "구글 시트에서 동기화"}
        </button>
        <a className="btn ghost" href="/api/admin/export">
          다운로드
        </a>
      </div>

      {result && !result.ok && <p className="msg err mt-14">{result.message}</p>}

      {result?.ok && (
        <>
          <p className="msg ok mt-14">
            시트 {result.total}명 — 새로 {result.added}명, 이미 있던{" "}
            {result.unchanged}명
          </p>
          <details className="mt-12">
            <summary>읽은 열 {result.headers.length}개</summary>
            <ul className="plain-list">
              {result.headers.map((h) => (
                <li key={h.field}>
                  <b>{h.label}</b> ← {h.columns.join(" · ")}
                </li>
              ))}
            </ul>
          </details>

          {result.skipped.length > 0 && (
            <details className="mt-12">
              <summary>건너뛴 행 {result.skipped.length}개</summary>
              <ul className="plain-list">
                {result.skipped.map((s) => (
                  <li key={s.row}>
                    {s.row}행 — {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.missing.length > 0 && (
            <div className="mt-14">
              <b className="block">시트에 없는 {result.missing.length}명</b>
              <small className="mt-8">
                시트에서 빠졌거나, 시트 쪽에서 이름·생년월일·전화번호가 바뀐
                사람이에요. 확인하고 지울 사람만 지워주세요.
              </small>
              <ul className="plain-list mt-8">
                {result.missing
                  .filter((m) => !gone.includes(m.id))
                  .map((m) => (
                    <li key={m.id} className="miss-row">
                      <span>
                        {m.name}
                        <small>
                          {m.birth_date}
                          {m.checkedIn ? " · 체크인함" : ""}
                          {m.bound ? " · 로그인 연결됨" : ""}
                        </small>
                      </span>
                      <button
                        className="btn sm ghost"
                        disabled={demo}
                        onClick={() => drop(m.id, m.name)}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      <small className="mt-12">
        시트가 원본입니다. 사람을 추가·수정하려면 시트를 고치고 이 버튼을
        누르세요. 이름·생년월일·전화번호 셋으로 사람을 구분하므로, 셋 중 하나를
        고치면 새 사람으로 들어오고 기존 행은 「시트에 없는 사람」에 나타납니다.
      </small>
    </div>
  );
}
