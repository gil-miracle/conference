"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";
import { useAdminDemo } from "../AdminMode";
import { createTeam, deleteTeam, updateTeam } from "../actions/teams";
import type { AdminTeam } from "@/lib/types";

/**
 * 조 만들기·고치기·지우기 — 숙소의 RoomEditor와 같은 자리, 같은 모양.
 *
 * 조에는 정원도 성별도 없다. 이름 하나뿐이라 폼도 한 줄이다.
 */
export default function TeamEditor({
  team,
  memberCount = 0,
  leaderName,
}: {
  /** 없으면 새 조를 만드는 모드 */
  team?: AdminTeam;
  memberCount?: number;
  leaderName?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const demo = useAdminDemo();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (open) setMsg(null);
  }, [open]);

  const submit = async (formData: FormData) => {
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = team ? await updateTeam(team.id, formData) : await createTeam(formData);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  const drop = async () => {
    if (!team) return;
    const ok = await confirm({
      message:
        memberCount > 0
          ? `${team.name}을 지울까요? 배정된 ${memberCount}명은 미배정으로 돌아가요.`
          : `${team.name}을 지울까요?`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await deleteTeam(team.id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      {team ? (
        <button type="button" className="room-open" onClick={() => setOpen(true)}>
          <b>{team.name}</b>
          <span className="cap">
            {memberCount}명{leaderName ? ` · 조장 ${leaderName}` : ""}
          </span>
        </button>
      ) : (
        <button className="btn sm ghost room-add" onClick={() => setOpen(true)}>
          ＋ 조 추가
        </button>
      )}

      <dialog
        ref={ref}
        className="pdetail"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
      >
        {open && (
          <div className="pdetail-in">
            <header>
              <b>{team ? "조 정보" : "조 추가"}</b>
            </header>

            <form className="pform" action={submit}>
              <label>
                <span>이름</span>
                <input
                  name="name"
                  defaultValue={team?.name ?? ""}
                  placeholder="오렌지조"
                  maxLength={20}
                  required
                />
              </label>

              <div className="pform-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn accent" disabled={busy}>
                  {busy ? "저장 중…" : team ? "저장" : "추가"}
                </button>
              </div>
            </form>

            {team && (
              <button
                type="button"
                className="btn sm danger full mt-12"
                disabled={busy}
                onClick={drop}
              >
                조 삭제
              </button>
            )}

            {msg && <p className="msg mt-12">{msg}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
