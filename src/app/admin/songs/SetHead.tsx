"use client";

import { useState } from "react";
import type { SongSet } from "@/lib/content";
import { useServerAction } from "@/hooks/useServerAction";
import { updateSongSet } from "../actions/songs";
import DeleteSetButton from "./DeleteSetButton";

/**
 * 집회 머리 — 이름·날짜·시각·인도자, 그리고 인라인 편집.
 *
 * 곡은 눌러서 고칠 수 있는데 집회는 지우는 길밖에 없었다. 인도자가 바뀌거나
 * 시각이 밀리면 집회를 지우고 다시 만들어야 했는데, 그러면 그 안에 든 곡이
 * 함께 사라진다 — 고칠 것보다 잃는 것이 크다.
 *
 * 곡 줄과 같은 모양으로 둔다. 같은 화면에서 고치는 일이 둘인데 생김새가
 * 다르면 어느 쪽이 어떻게 열리는지 따로 외워야 한다.
 */
export default function SetHead({ set, demo }: { set: SongSet; demo: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(set.name);
  const [day, setDay] = useState(set.dayLabel ?? "");
  const [time, setTime] = useState(set.timeLabel ?? "");
  const [leader, setLeader] = useState(set.leader ?? "");
  const { pending, run } = useServerAction();

  if (editing) {
    return (
      <div className="set-head editing">
        <div className="edit-grid set-edit">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="집회 이름" />
          <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="날짜 (금 11)" />
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="시각 (21:00)" />
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="찬양 인도"
          />
        </div>
        <div className="edit-acts">
          <button
            className="btn sm accent"
            disabled={pending || !name.trim()}
            onClick={() =>
              run(async () => {
                // 빈 칸은 지운 것으로 본다 — 빈 문자열이 남으면 화면에 점만 찍힌다
                await updateSongSet(set.id, {
                  name: name.trim(),
                  day_label: day.trim() || null,
                  time_label: time.trim() || null,
                  leader: leader.trim() || null,
                });
                setEditing(false);
              })
            }
          >
            저장
          </button>
          <button className="btn sm ghost" onClick={() => setEditing(false)}>
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="set-head">
      <div>
        <b>{set.name}</b>
        <small>
          {[set.dayLabel, set.timeLabel, set.leader].filter(Boolean).join(" · ") || "TBD"}
          {` · ${set.songs.length} SONGS`}
        </small>
      </div>
      {!demo && (
        <div className="acts">
          <button className="btn sm ghost" onClick={() => setEditing(true)}>
            수정
          </button>
          <DeleteSetButton setId={set.id} name={set.name} />
        </div>
      )}
    </div>
  );
}
