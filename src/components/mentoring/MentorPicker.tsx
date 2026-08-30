"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";
import { fmtDateTime } from "@/lib/format";
import {
  leaveMentorSession,
  setMentorSession,
} from "@/app/admin/actions/mentoring";
import type { MentorBoard } from "@/lib/mentoring";

/**
 * 세션 고르기.
 *
 * 처음 누르면 신청, 다른 카드를 누르면 옮기기 — 둘 다 같은 동작이라 화면에서도
 * 같은 자리에 둔다. 옮기려던 자리가 차 있으면 아무 일도 일어나지 않고 원래
 * 자리에 그대로 있는다.
 */
export default function MentorPicker({ board }: { board: MentorBoard }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const now = Date.now();

  const choose = async (id: string, name: string) => {
    if (board.mine && board.mine !== id) {
      const ok = await confirm({
        message: `${name} 세션으로 옮길까요? 지금 신청한 자리는 비워집니다.`,
        confirmLabel: "옮기기",
      });
      if (!ok) return;
    }
    setBusy(true);
    const res = await setMentorSession(id);
    setBusy(false);
    setMsg(res.message);
    if (res.ok) router.refresh();
  };

  const cancel = async () => {
    const ok = await confirm({
      message: "신청을 취소할까요? 자리가 다시 열립니다.",
      confirmLabel: "취소하기",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const res = await leaveMentorSession();
    setBusy(false);
    setMsg(res.message);
    if (res.ok) router.refresh();
  };

  return (
    <div className="reveal">
      {board.sessions.map((s) => {
        const mine = board.mine === s.id;
        const opensAt = new Date(s.opens_at).getTime();
        const closesAt = new Date(s.closes_at).getTime();
        const before = now < opensAt;
        const after = now > closesAt;
        // 내 자리는 정원에서 빼고 센다 — 내가 앉은 자리를 "찼다"고 하지 않는다
        const others = mine ? s.taken - 1 : s.taken;
        const full = others >= s.capacity;

        return (
          <div className={`ms${mine ? " mine" : ""}`} key={s.id}>
            <div className="ms-top">
              <b>{s.mentor_name}</b>
              <span className="ms-cap">
                {s.taken} / {s.capacity}
              </span>
            </div>
            <p className="ms-title">{s.title}</p>
            <p className="ms-meta">
              {fmtDateTime(s.starts_at)}
              {s.place && ` · ${s.place}`}
            </p>

            {mine ? (
              <div className="ms-actions">
                <span className="ms-mine">신청함</span>
                <button
                  className="btn-plain"
                  disabled={busy || after}
                  onClick={cancel}
                >
                  {after ? "마감됨" : "취소"}
                </button>
              </div>
            ) : (
              <button
                className="btn sm accent ms-pick"
                disabled={busy || before || after || full}
                onClick={() => choose(s.id, s.mentor_name)}
              >
                {before
                  ? `${fmtDateTime(s.opens_at)}부터`
                  : after
                    ? "마감"
                    : full
                      ? "자리 참"
                      : board.mine
                        ? "이리로 옮기기"
                        : "신청하기"}
              </button>
            )}
          </div>
        );
      })}

      {msg && <p className="msg mt-14">{msg}</p>}
    </div>
  );
}
