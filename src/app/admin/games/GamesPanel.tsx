"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Confirm";
import { useAdminDemo } from "../AdminMode";
import { createGame, deleteGame, updateGame } from "../actions/games";
import type { AdminParticipant } from "@/lib/types";
import type { Game } from "@/lib/game-types";

type Person = Pick<AdminParticipant, "id" | "name">;

/**
 * 게임 만들고 고치고 지우기 — 숙소·조와 같은 모양.
 *
 * 진행자 배정(host_id)은 **누가 진행하는지 적어두는 칸**이다. 자물쇠가 아니다 —
 * 진행자면 어느 게임이든 점수를 넣을 수 있다. 게임별로 권한을 쪼개면 옆 게임이
 * 먼저 끝난 사람이 대신 넣어줄 수 없고, 배정을 깜빡하면 아무도 못 넣는다.
 */
function GameEditor({
  game,
  people,
  nextOrder,
}: {
  game?: Game;
  people: Person[];
  nextOrder: number;
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
    const res = game ? await updateGame(game.id, formData) : await createGame(formData);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  const drop = async () => {
    if (!game) return;
    const ok = await confirm({
      message: `${game.name}을 지울까요? 이 게임에 넣은 점수도 함께 사라져요.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (demo) return setMsg("미리보기 모드 — 저장되지 않아요.");
    setBusy(true);
    const res = await deleteGame(game.id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    setOpen(false);
    router.refresh();
  };

  const hostName = people.find((p) => p.id === game?.host_id)?.name;

  return (
    <>
      {game ? (
        <button type="button" className="room-open" onClick={() => setOpen(true)}>
          <b>{game.name}</b>
          <span className="cap">{hostName ? `진행 ${hostName}` : "진행자 없음"}</span>
        </button>
      ) : (
        <button className="btn sm ghost room-add" onClick={() => setOpen(true)}>
          ＋ 게임 추가
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
              <b>{game ? "게임 정보" : "게임 추가"}</b>
            </header>

            <form className="pform" action={submit}>
              <label>
                <span>이름</span>
                <input
                  name="name"
                  defaultValue={game?.name ?? ""}
                  placeholder="이어달리기"
                  maxLength={40}
                  required
                />
              </label>
              <label>
                <span>진행자</span>
                <select name="host_id" defaultValue={game?.host_id ?? ""}>
                  <option value="">정하지 않음</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {/* 진행자 화면에 그대로 뜬다 — 배점을 적어두면 매번 기억 안 해도 된다 */}
                <span>메모</span>
                <input
                  name="note"
                  defaultValue={game?.note ?? ""}
                  placeholder="1등 100 · 2등 80 · 3등 60"
                  maxLength={60}
                />
              </label>
              <label>
                <span>순서</span>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={game?.sort_order ?? nextOrder}
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
                  {busy ? "저장 중…" : game ? "저장" : "추가"}
                </button>
              </div>
            </form>

            {game && (
              <button
                type="button"
                className="btn sm danger full mt-12"
                disabled={busy}
                onClick={drop}
              >
                게임 삭제
              </button>
            )}

            {msg && <p className="msg mt-12">{msg}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}

export default function GamesPanel({
  games,
  people,
}: {
  games: Game[];
  people: Person[];
}) {
  const nextOrder = games.length
    ? Math.max(...games.map((g) => g.sort_order)) + 1
    : 0;

  return (
    <>
      <div className="sec-title">
        <b>레크리에이션 게임</b>
      </div>

      <GameEditor people={people} nextOrder={nextOrder} />

      {games.length === 0 ? (
        <p className="hint-sm">
          아직 게임이 없어요. 여기서 만들면 진행자 화면에 나타납니다.
        </p>
      ) : (
        games.map((game) => (
          <div className="room" key={game.id}>
            <GameEditor game={game} people={people} nextOrder={nextOrder} />
            {game.note && <small className="room-note">{game.note}</small>}
          </div>
        ))
      )}

      <p className="hint-sm mt-20">
        점수는 여기서 넣지 않아요 — 진행자 화면에서 넣습니다. 진행자 배정은
        누가 맡는지 적어두는 것일 뿐, 진행자면 어느 게임이든 점수를 넣을 수 있어요.
      </p>
    </>
  );
}
