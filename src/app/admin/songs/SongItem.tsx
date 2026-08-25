"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Song } from "@/lib/content";
import { deleteSong, moveSong, updateSong } from "../actions/songs";

/** 곡 한 줄 — 탭하면 인라인 편집 */
export default function SongItem({
  song,
  index,
  demo,
}: {
  song: Song;
  index: number;
  demo: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(song.title);
  const [youtube, setYoutube] = useState(song.youtubeId ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  if (editing) {
    return (
      <li className="song-row editing">
        <div className="edit-grid">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="곡 제목" />
          <input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="YouTube 주소 또는 ID"
          />
        </div>
        <div className="edit-acts">
          <button
            className="btn sm accent"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await updateSong(song.id, { title, youtube });
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
      </li>
    );
  }

  return (
    <li className="song-row">
      <span className="no">{String(index + 1).padStart(2, "0")}</span>
      <div className="info">
        <b>{song.title}</b>
        <small>{song.youtubeId ?? "NO VIDEO"}</small>
      </div>
      {!demo && (
        <div className="acts">
          <button
            className="icon-btn"
            aria-label="위로"
            disabled={pending}
            onClick={() => run(() => moveSong(song.id, "up"))}
          >
            ↑
          </button>
          <button
            className="icon-btn"
            aria-label="아래로"
            disabled={pending}
            onClick={() => run(() => moveSong(song.id, "down"))}
          >
            ↓
          </button>
          <button className="btn sm ghost" onClick={() => setEditing(true)}>
            수정
          </button>
          <button
            className="icon-btn del"
            aria-label="삭제"
            disabled={pending}
            onClick={() => {
              if (confirm(`'${song.title}' 곡을 삭제할까요?`)) run(() => deleteSong(song.id));
            }}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}
