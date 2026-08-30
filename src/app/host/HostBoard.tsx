"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBonus, removeBonus, saveGameScores } from "../admin/actions/games";
import type { AdminTeam } from "@/lib/types";
import type { Bonus, Game, GameScore, Standing } from "@/lib/game-types";

/**
 * 점수와 순위만 있는 한 화면.
 *
 * 게임을 고르면 그 게임의 조별 점수가 뜨고, 다 넣고 한 번에 저장한다.
 * 조마다 따로 저장하면 반쯤 저장된 상태가 남는데, 사회를 보며 넣는 자리라
 * 어디까지 들어갔는지 되짚을 여유가 없다.
 */
export default function HostBoard({
  games,
  teams,
  scores,
  bonuses,
  standings,
}: {
  games: Game[];
  teams: AdminTeam[];
  scores: GameScore[];
  bonuses: Bonus[];
  standings: Standing[];
}) {
  const router = useRouter();
  const [gameId, setGameId] = useState(games[0]?.id ?? "");
  /* 입력 중인 값은 문자열로 들고 있는다 — 지웠을 때 0으로 튀지 않게 */
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [bonusTeam, setBonusTeam] = useState("");
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const game = games.find((g) => g.id === gameId) ?? null;
  const saved = (teamId: string) =>
    scores.find((s) => s.game_id === gameId && s.team_id === teamId)?.points ?? 0;
  const value = (teamId: string) =>
    draft[teamId] ?? String(saved(teamId));

  const dirty = teams.some((t) => Number(value(t.id) || 0) !== saved(t.id));

  const pickGame = (id: string) => {
    setGameId(id);
    setDraft({});
    setMsg(null);
  };

  const save = async () => {
    if (!game) return;
    setBusy(true);
    const res = await saveGameScores(
      game.id,
      teams.map((t) => ({ teamId: t.id, points: Number(value(t.id) || 0) }))
    );
    setBusy(false);
    setMsg(res.message);
    if (!res.ok) return;
    setDraft({});
    router.refresh();
  };

  const giveBonus = async () => {
    setBusy(true);
    const res = await addBonus(bonusTeam, Number(bonusPoints), bonusReason);
    setBusy(false);
    setMsg(res.message);
    if (!res.ok) return;
    setBonusPoints("");
    setBonusReason("");
    router.refresh();
  };

  const dropBonus = async (id: string) => {
    setBusy(true);
    const res = await removeBonus(id);
    setBusy(false);
    if (!res.ok) return setMsg(res.message);
    router.refresh();
  };

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "지운 조";

  return (
    <div className="host">
      <header className="host-top">
        <b>레크리에이션</b>
        <span>점수 · 순위</span>
      </header>

      <div className="container">
        {/* 지금 순위를 맨 위에 — 점수를 넣는 내내 보게 된다 */}
        <div className="sec-title">
          <b>순위</b>
        </div>
        {standings.length === 0 ? (
          <p className="hint-sm">아직 조가 없어요. 참가자 → 팀에서 만들어주세요.</p>
        ) : (
          <ol className="rank">
            {standings.map((s, i) => (
              <li key={s.id} className={i === 0 && s.total > 0 ? "top" : ""}>
                <span className="n">{i + 1}</span>
                <b>{s.name}</b>
                <em>
                  {s.total}
                  {s.bonus_total > 0 && <i>가산 {s.bonus_total}</i>}
                </em>
              </li>
            ))}
          </ol>
        )}

        <div className="sec-title">
          <b>게임 점수</b>
        </div>
        {games.length === 0 ? (
          <p className="hint-sm">
            아직 게임이 없어요. 관리자가 <code>/admin/games</code>에서 만들면 여기
            나타나요.
          </p>
        ) : (
          <>
            <div className="gtabs">
              {games.map((g) => (
                <button
                  key={g.id}
                  className={`gtab${g.id === gameId ? " on" : ""}`}
                  onClick={() => pickGame(g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {game?.note && <p className="hint-sm">{game.note}</p>}

            <div className="score-list">
              {teams.map((t) => (
                <label className="score-row" key={t.id}>
                  <b>{t.name}</b>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value(t.id)}
                    disabled={busy}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [t.id]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>

            <button
              className="btn accent full mt-14"
              disabled={busy || !dirty}
              onClick={save}
            >
              {busy ? "저장 중…" : dirty ? "점수 저장" : "저장됨"}
            </button>
          </>
        )}

        <div className="sec-title">
          <b>가산점</b>
        </div>
        <div className="bonus-form">
          <select
            value={bonusTeam}
            disabled={busy}
            onChange={(e) => setBonusTeam(e.target.value)}
          >
            <option value="">조 고르기</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="점수"
            className="w-70"
            value={bonusPoints}
            disabled={busy}
            onChange={(e) => setBonusPoints(e.target.value)}
          />
          <input
            placeholder="사유 — 숙소 정리 잘함"
            value={bonusReason}
            maxLength={60}
            disabled={busy}
            onChange={(e) => setBonusReason(e.target.value)}
          />
          <button
            className="btn sm ghost"
            disabled={busy || !bonusTeam || !bonusPoints || !bonusReason.trim()}
            onClick={giveBonus}
          >
            주기
          </button>
        </div>

        {bonuses.length > 0 && (
          <div className="bonus-list">
            {bonuses.map((b) => (
              <div className="bonus-row" key={b.id}>
                <span>
                  <b>{teamName(b.team_id)}</b> +{b.points}
                  <i>{b.reason}</i>
                </span>
                <button
                  className="btn-plain"
                  disabled={busy}
                  onClick={() => dropBonus(b.id)}
                >
                  지우기
                </button>
              </div>
            ))}
          </div>
        )}

        {msg && <p className="msg mt-14">{msg}</p>}
      </div>
    </div>
  );
}
