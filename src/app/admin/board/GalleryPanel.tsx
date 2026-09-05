"use client";

import { useEffect, useRef, useState } from "react";
import Toast from "@/components/Toast";
import PhotoViewer from "@/components/gallery/PhotoViewer";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { thumbUrl } from "@/lib/cloudinary";
import { uploadOnePhoto } from "@/lib/gallery-upload";
import type { Photo } from "@/lib/types";
import { deletePhotoAdmin, reorderPhotos, setPhotoHidden } from "../actions/moderation";

/** 손가락으로 잡을 때 이만큼 누르고 있어야 집힌다 — 그 전엔 스크롤이다 */
const HOLD_MS = 220;
/** 그 사이 이만큼 움직이면 집는 것이 아니라 넘기는 것으로 본다 */
const SLOP = 8;

/**
 * 갤러리 관리 — 올리고, 차례를 정하고, 내리고, 지운다.
 *
 * 참가자 화면에는 올리는 길도 지우는 길도 없다. 갤러리는 「우리의 순간들」
 * 한 곳뿐이라 아무나 올린 것이 곧 공식 기록이 되고, 올린 사람이 지우면
 * 남들이 이미 본 것이 말없이 사라진다. 두 일을 여기 한 곳으로 모았다.
 *
 * 차례는 끌어서 바꾼다. 사진은 여러 사람 폰에서 모여 와 올린 시각이 찍은
 * 시각과 다르다 — 저녁 사진이 아침 사진 앞에 서는 일이 생긴다.
 *
 * 마우스는 누르는 즉시 집힌다. 손가락은 잠깐 누르고 있어야 집힌다 — 안
 * 그러면 화면을 넘기려 할 때마다 사진이 딸려 온다.
 */
export default function GalleryPanel({
  initial,
  cloudName,
  demo,
}: {
  initial: Photo[];
  cloudName: string | null;
  demo: boolean;
}) {
  const [rows, setRows] = useState<Photo[]>(initial);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  /* 같은 손짓 안에서 바로 읽어야 해서 ref로도 들고 있는다 — 상태는 다음
     그림에나 반영되는데, 자리 맞바꿈은 이 이벤트 안에서 끝나야 한다 */
  const heldRef = useRef<string | null>(null);
  const { toast, showToast } = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const down = useRef<{ x: number; y: number; id: string; touch: boolean } | null>(null);
  const moved = useRef(false);
  /* 끌고 놓은 손짓 뒤에는 브라우저가 클릭을 한 번 더 준다. 그대로 두면
     사진을 옮겨 놓자마자 그 사진이 크게 열린다 */
  const dragged = useRef(false);

  /*
   * 집고 있는 동안에는 화면이 따라 굴러다니면 안 된다. touch-action으로
   * 아예 막아 두면 평소 스크롤까지 죽으므로, 집은 뒤에만 막는다.
   */
  useEffect(() => {
    if (!held) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", stop, { passive: false });
    // 격자 밖에서 손을 떼도 놓아 준다 — 안 그러면 집힌 채로 남는다
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      document.removeEventListener("touchmove", stop);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [held]);

  const guard = () => {
    if (demo) showToast("미리보기 모드 — 변경사항은 저장되지 않아요.");
    return demo;
  };

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0 || guard()) return;
    const list = Array.from(files).slice(0, 20);
    for (let i = 0; i < list.length; i++) {
      setUploading(`${i + 1}/${list.length}`);
      const result = await uploadOnePhoto(list[i]);
      if (!result.ok) {
        showToast(result.message, true);
        break;
      }
      // 새로 올린 것은 맨 뒤에 선다 (0039 트리거)
      setRows((prev) => [...prev, result.photo]);
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onHide(photo: Photo) {
    if (guard()) return;
    const next = !photo.hidden;
    setRows((prev) => prev.map((p) => (p.id === photo.id ? { ...p, hidden: next } : p)));
    await setPhotoHidden(photo.id, next);
  }

  async function onDelete(photo: Photo) {
    if (guard()) return;
    const ok = await confirm({
      message: "이 사진을 아주 지울까요? 되돌릴 수 없어요. 잠깐 내려 두려면 숨기기를 쓰세요.",
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    setViewing(null);
    setRows((prev) => prev.filter((p) => p.id !== photo.id));
    await deletePhotoAdmin(photo.id);
    showToast("사진을 지웠어요.");
  }

  /* ── 끌어서 차례 바꾸기 ─────────────────────────────────────── */

  const pick = (id: string) => {
    heldRef.current = id;
    setHeld(id);
    moved.current = false;
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (demo) return;
    const touch = e.pointerType !== "mouse";
    down.current = { x: e.clientX, y: e.clientY, id, touch };
    // 손가락은 잠깐 누르고 있어야 집힌다. 마우스는 움직이기 시작해야 집힌다 —
    // 누르자마자 집으면 그냥 눌러서 크게 보는 일이 영영 안 된다
    if (touch) timer.current = setTimeout(() => pick(id), HOLD_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = down.current;
    if (!start) return;
    const far = Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP;

    if (!heldRef.current) {
      if (!far) return;
      if (start.touch) {
        // 길게 누르기 전에 움직였다 = 화면을 넘기려는 것이다
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        down.current = null;
        return;
      }
      pick(start.id);
    }

    const under = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-photo]");
    const overId = under?.dataset.photo;
    const holding = heldRef.current;
    if (!overId || !holding || overId === holding) return;

    setRows((prev) => {
      const from = prev.findIndex((p) => p.id === holding);
      const to = prev.findIndex((p) => p.id === overId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next.splice(to, 0, ...next.splice(from, 1));
      moved.current = true;
      return next;
    });
  };

  const onPointerUp = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    down.current = null;
    if (!heldRef.current) return;
    heldRef.current = null;
    setHeld(null);
    // 집었다 놓은 손짓이면 뒤따라오는 클릭은 무시한다
    dragged.current = true;
    if (!moved.current) return;
    moved.current = false;
    // 화면은 이미 바뀐 차례를 보여주고 있다 — 저장은 뒤따라간다
    reorderPhotos(rowsRef.current.map((p) => p.id));
  };

  return (
    <>
      <div className="gal-mod-head">
        <b>갤러리 관리</b>
        <span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <button
            type="button"
            className="head-action"
            disabled={uploading !== null || !cloudName}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? `올리는 중 ${uploading}` : "사진 올리기"}
          </button>
        </span>
      </div>
      {!cloudName && (
        <p className="msg err">Cloudinary 설정 전이라 업로드가 꺼져 있어요.</p>
      )}

      {rows.length === 0 ? (
        <p className="msg">아직 올라온 사진이 없어요.</p>
      ) : (
        <>
          <p className="msg">
            끌어서 차례를 바꿉니다. 손가락으로는 잠깐 누르고 있으면 집혀요.
            사진을 누르면 크게 보이고, 거기서 숨기거나 지울 수 있어요.
          </p>
          <div
            className="gal-mod"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {rows.map((photo, i) => (
              <div
                key={photo.id}
                data-photo={photo.id}
                className={`cell${photo.hidden ? " dim" : ""}${
                  held === photo.id ? " held" : ""
                }`}
                onPointerDown={(e) => onPointerDown(e, photo.id)}
              >
                <button
                  type="button"
                  className="cell-open"
                  onClick={() => {
                    if (dragged.current) return void (dragged.current = false);
                    setViewing(i);
                  }}
                >
                  {cloudName && (
                    <img
                      src={thumbUrl(photo.cloudinary_public_id)}
                      alt=""
                      loading="lazy"
                      draggable={false}
                    />
                  )}
                </button>
                {photo.hidden && <span className="cell-tag">숨김</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {viewing !== null && rows[viewing] && (
        <PhotoViewer
          photos={rows}
          at={viewing}
          onMove={(n) => n >= 0 && n < rows.length && setViewing(n)}
          onClose={() => setViewing(null)}
          admin={{ onHide, onDelete }}
        />
      )}
      <Toast toast={toast} />
    </>
  );
}
