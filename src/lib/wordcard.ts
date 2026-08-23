import { THEME_VERSE } from "./content";

/**
 * 화면의 말씀카드(정사각 1:1)를 1080px 캔버스로 다시 그려 PNG Blob 생성.
 * 인쇄용 고품질 카드는 design/wordcards의 Python 파이프라인이 담당하고,
 * 여기서는 참가자 이름(FOR)이 들어간 SNS 공유용을 즉석 생성한다.
 * (클라이언트 전용 — canvas/document 사용)
 */
export async function renderWordcardPng(name: string): Promise<Blob> {
  try {
    await Promise.all([
      document.fonts.load('400 30px "Nanum Myeongjo"'),
      document.fonts.load('700 30px "Nanum Myeongjo"'),
      document.fonts.load('500 17px "IBM Plex Mono"'),
    ]);
    await document.fonts.ready;
  } catch {
    // 폰트 로드 실패 시 시스템 폰트로 대체
  }

  const S = 1080;
  const pad = Math.round(S * 0.065); // 70
  const inner = S - pad * 2; // 940
  const gap = Math.round(inner * 0.07); // 66
  const imgW = Math.round(inner * 0.34); // 320
  const txtX = pad + imgW + gap;
  const txtW = S - pad - txtX;

  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // 종이 배경 + 테두리
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "#211D19";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, S - 2, S - 2);

  // 좌측 이미지 기둥 (cover, 가로 38% 지점 크롭 — CSS object-position 동일)
  const img = new Image();
  img.src = "/wordcard-bg.jpg";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("bg load fail"));
  });
  const scale = Math.max(imgW / img.width, inner / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const ox = (dw - imgW) * 0.38;
  const oy = (dh - inner) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, imgW, inner);
  ctx.clip();
  ctx.drawImage(img, pad - ox, pad - oy, dw, dh);
  ctx.restore();

  const setSpacing = (px: number) => {
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
    } catch {
      // 미지원 브라우저
    }
  };

  // 레퍼런스 라벨
  ctx.fillStyle = "#DC5A51";
  ctx.font = '500 17px "IBM Plex Mono", monospace';
  setSpacing(4.4);
  ctx.textBaseline = "top";
  ctx.fillText(THEME_VERSE.refShort, txtX, pad + 2);
  setSpacing(0);

  // 구절 (공백 단위 자동 줄바꿈, 볼드 혼합)
  const verseSize = 30;
  const lineH = Math.round(verseSize * 2.1);
  const fontOf = (b: boolean) =>
    `${b ? 700 : 400} ${verseSize}px "Nanum Myeongjo", serif`;
  const toks = THEME_VERSE.segments.flatMap((seg) =>
    seg.t
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ w, b: !!seg.b }))
  );
  ctx.font = fontOf(false);
  const spaceW = ctx.measureText(" ").width;

  let x = 0;
  let y = pad + 2 + 17 + Math.round(txtW * 0.165); // 라벨 아래 margin-top 9%×1.84
  ctx.fillStyle = "#211D19";
  ctx.textBaseline = "alphabetic";
  for (const tok of toks) {
    ctx.font = fontOf(tok.b);
    const w = ctx.measureText(tok.w).width;
    if (x > 0 && x + w > txtW) {
      x = 0;
      y += lineH;
    }
    ctx.fillText(tok.w, txtX + x, y + verseSize);
    x += w + spaceW;
  }

  // 푸터 (하단 정렬)
  ctx.fillStyle = "rgba(33,29,25,.56)";
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  setSpacing(3.2);
  ctx.fillText(`FOR ${name}`, txtX, pad + inner - 6 - 32);
  ctx.fillText("MIRACLE 2026", txtX, pad + inner - 6);
  setSpacing(0);

  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (blob) => (blob ? res(blob) : rej(new Error("toBlob fail"))),
      "image/png"
    )
  );
}

/** Blob을 파일로 다운로드 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
