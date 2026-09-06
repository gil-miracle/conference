"use client";

import { useState } from "react";
import GuestbookModItem, { type ModEntry } from "./GuestbookModItem";
import GalleryPanel from "./GalleryPanel";
import type { Photo } from "@/lib/types";

/** 한 번에 보여 주는 노트 수 — 스무 개면 화면 하나를 조금 넘는다 */
const PAGE = 20;

/**
 * 게시판 — 한 줄 노트와 갤러리.
 *
 * 둘을 한 화면에 세로로 이어 놓았더니, 사진을 손보려면 노트를 전부 지나야
 * 했다. 행사 중에는 노트가 계속 쌓이므로 그 거리가 매일 길어진다. 갈래로
 * 나눈다 — 명단 안쪽 갈래(RosterTabs)와 같은 모양이다.
 *
 * 노트는 스무 개씩 끊어 낸다. 사진은 끊지 않는다 — 끌어서 차례를 바꾸는
 * 자리라 목록이 잘리면 열 번째를 스무 번째 뒤로 못 보낸다.
 */
export default function BoardTabs({
  entries,
  photos,
  cloudName,
  demo,
}: {
  entries: ModEntry[];
  photos: Photo[];
  cloudName: string | null;
  demo: boolean;
}) {
  const [tab, setTab] = useState<"notes" | "photos">("notes");
  const [shown, setShown] = useState(PAGE);

  return (
    <>
      <nav className="subtabs">
        <div className="subtabs-in">
          <button
            type="button"
            className={tab === "notes" ? "on" : ""}
            onClick={() => setTab("notes")}
          >
            한 줄 노트 {entries.length > 0 && <em>{entries.length}</em>}
          </button>
          <button
            type="button"
            className={tab === "photos" ? "on" : ""}
            onClick={() => setTab("photos")}
          >
            갤러리 {photos.length > 0 && <em>{photos.length}</em>}
          </button>
        </div>
      </nav>

      {tab === "notes" ? (
        entries.length === 0 ? (
          <p className="msg">아직 남긴 노트가 없어요.</p>
        ) : (
          <>
            {entries.slice(0, shown).map((entry) => (
              <GuestbookModItem key={entry.id} entry={entry} />
            ))}
            {shown < entries.length && (
              <button
                type="button"
                className="btn ghost full mt-14"
                onClick={() => setShown((n) => n + PAGE)}
              >
                더 보기 · {entries.length - shown}개 남음
              </button>
            )}
          </>
        )
      ) : (
        <GalleryPanel initial={photos} cloudName={cloudName} demo={demo} />
      )}
    </>
  );
}
