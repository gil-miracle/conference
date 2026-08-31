"use client";

import { useMemo, useState } from "react";
import type { SongSet } from "@/lib/content";
import { ChevronIcon, PlayIcon } from "@/components/icons";

/**
 * 플레이리스트 — 상단 YouTube 플레이어 + 집회 탭 + 트랙 목록.
 * 탭을 바꿔도 재생 중인 곡은 유지되고, 트랙을 누르면 영상만 교체된다.
 */
export default function Playlist({ sets }: { sets: SongSet[] }) {
  const [activeSet, setActiveSet] = useState(0);
  // 재생 중인 곡은 집회를 넘나들 수 있으므로 곡 id로 추적
  const firstPlayable = useMemo(() => {
    for (const set of sets) {
      const found = set.songs.find((s) => s.youtubeId);
      if (found) return found.id;
    }
    return sets[0]?.songs[0]?.id ?? null;
  }, [sets]);

  const [currentId, setCurrentId] = useState<string | null>(firstPlayable);
  const [autoplay, setAutoplay] = useState(false);

  const current = useMemo(() => {
    for (const set of sets) {
      const song = set.songs.find((s) => s.id === currentId);
      if (song) return { song, setName: set.name };
    }
    return null;
  }, [sets, currentId]);

  // 앞뒤 곡 이동은 집회를 가로질러 전체 순서를 따른다 —
  // 한 집회 끝에서 멈추지 않고 다음 집회로 이어 듣게 된다.
  const flat = useMemo(
    () => sets.flatMap((set, si) => set.songs.map((song) => ({ id: song.id, si }))),
    [sets]
  );
  const at = flat.findIndex((f) => f.id === currentId);
  const prev = at > 0 ? flat[at - 1] : null;
  const next = at >= 0 && at < flat.length - 1 ? flat[at + 1] : null;

  const goTo = (target: { id: string; si: number } | null) => {
    if (!target) return;
    setCurrentId(target.id);
    setAutoplay(true);
    // 재생 중인 곡이 보이는 목록과 어긋나지 않게 탭도 따라간다
    setActiveSet(target.si);
  };

  if (sets.length === 0) {
    return <p className="msg">아직 등록된 찬양이 없어요.</p>;
  }

  const shown = sets[activeSet] ?? sets[0];

  return (
    <div className="playlist reveal">
      <div className="pl-stage">
        {current?.song.youtubeId ? (
          <iframe
            key={current.song.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${current.song.youtubeId}?rel=0${
              autoplay ? "&autoplay=1" : ""
            }`}
            title={current.song.title}
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

      {current && (
        <div className="pl-now">
          <div className="pl-now-info">
            <div className="eyebrow">NOW PLAYING</div>
            <b>{current.song.title}</b>
            <small>{current.setName}</small>
          </div>
          {(prev || next) && (
            <div className="pl-nav">
              <button
                aria-label="이전 곡"
                disabled={!prev}
                onClick={() => goTo(prev)}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                aria-label="다음 곡"
                disabled={!next}
                onClick={() => goTo(next)}
              >
                <ChevronIcon />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="day-tabs pl-tabs">
        {sets.map((set, i) => (
          <button
            key={set.id}
            className={i === activeSet ? "on" : ""}
            onClick={() => setActiveSet(i)}
          >
            {/* 같은 날 집회가 둘 이상이라 날짜만으론 구분되지 않는다 */}
            <span className="d">{set.dayLabel ?? set.name}</span>
            {set.timeLabel && <span className="t">{set.timeLabel}</span>}
          </button>
        ))}
      </div>

      <div className="pl-set-name">
        <b>{shown.name}</b>
        <small>
          {[
            shown.timeLabel,
            shown.leader ? `찬양 인도 ${shown.leader}` : null,
            `${shown.songs.length} SONGS`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </div>

      <ol className="pl-list">
        {shown.songs.length === 0 && (
          <li className="pl-empty-row">
            곡이 아직 확정되지 않았어요. 정해지면 여기에 올라옵니다.
          </li>
        )}
        {shown.songs.map((song, i) => (
          <li key={song.id}>
            <button
              className={`pl-item${song.id === currentId ? " on" : ""}`}
              onClick={() => {
                setCurrentId(song.id);
                setAutoplay(true);
              }}
              aria-current={song.id === currentId ? "true" : undefined}
            >
              <span className="no">
                {song.id === currentId ? <PlayIcon /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="info">
                <b>{song.title}</b>
              </span>
              {!song.youtubeId && <span className="soon">SOON</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
