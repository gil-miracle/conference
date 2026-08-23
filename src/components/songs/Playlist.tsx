"use client";

import { useState } from "react";
import type { Song } from "@/lib/content";
import { PlayIcon } from "@/components/icons";

/**
 * 플레이리스트 — 상단 YouTube 플레이어 + 하단 트랙 목록.
 * 트랙을 누르면 같은 자리에서 영상만 교체된다(페이지 이동 없음).
 */
export default function Playlist({ songs }: { songs: Song[] }) {
  const firstPlayable = songs.findIndex((s) => s.youtubeId);
  const [current, setCurrent] = useState(firstPlayable >= 0 ? firstPlayable : 0);
  const [autoplay, setAutoplay] = useState(false);

  const song = songs[current];
  const hasVideo = Boolean(song?.youtubeId);

  function select(index: number) {
    setCurrent(index);
    setAutoplay(true);
  }

  return (
    <div className="playlist reveal">
      <div className="pl-stage">
        {hasVideo ? (
          <iframe
            key={song.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?rel=0${
              autoplay ? "&autoplay=1" : ""
            }`}
            title={song.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="pl-empty">
            <PlayIcon />
            <p>영상 링크가 아직 등록되지 않았어요.</p>
          </div>
        )}
      </div>

      <div className="pl-now">
        <div className="eyebrow">NOW PLAYING</div>
        <b>{song?.title}</b>
        <small>
          {song?.sub} · KEY {song?.key}
        </small>
      </div>

      <ol className="pl-list">
        {songs.map((s, i) => (
          <li key={s.title}>
            <button
              className={`pl-item${i === current ? " on" : ""}`}
              onClick={() => select(i)}
              aria-current={i === current ? "true" : undefined}
            >
              <span className="no">
                {i === current ? <PlayIcon /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="info">
                <b>{s.title}</b>
                <small>{s.sub}</small>
              </span>
              <span className="key">{s.key}</span>
              {!s.youtubeId && <span className="soon">준비중</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
