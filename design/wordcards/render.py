# -*- coding: utf-8 -*-
"""말씀카드 일괄 렌더 — 비율 3종 × 구절 100개.

머리에 든 생각:

* 디자인은 이미 승인된 것이 있다(rendered/ 아래 10장). 새로 그리지 않고
  같은 CSS로 다시 뽑아 어긋나지 않게 한다. 치수는 그 10장을 픽셀로 재서
  맞췄다 — 초안 HTML의 vw·clamp 값은 화면 폭에 딸린 값이라 1500px로
  키우면 그대로 쓰지 못한다.
* 본문은 반드시 **세 줄**이다. 두 줄이면 허전하고 네 줄이면 그림 위로
  넘어가 깨진다. 그래서 줄을 자동으로 셋으로 나누고, 가장 긴 줄이 글상자에
  들어갈 때까지 글자를 줄인다. 줄 수를 글자 크기가 따라가는 것이지 그 반대가
  아니다.
* 크롬을 한 장마다 띄우면 300번을 띄워야 한다. 한 장에 여러 카드를 세로로
  쌓아 한 번에 찍고 잘라 쓴다.

    python design/wordcards/render.py            # 전부
    python design/wordcards/render.py --limit 3  # 앞의 3개만 (시안 확인용)
"""

from __future__ import annotations

import argparse
import base64
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from verses import VERSES  # noqa: E402

HERE = Path(__file__).parent
SEP = chr(10)
ART = HERE / "art"
OUT = HERE / "rendered"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")

# ── 비율 3종 ────────────────────────────────────────────────────────────
# 값은 rendered/ 의 승인본을 재서 얻은 것이다 (사43_19 기준).
RATIOS = {
    "square": dict(
        w=1080, h=1080, per_page=10,
        pad=70, img_w=320, gap=66,          # 글상자 = 1080-70*2-320-66 = 554
        ref_px=26, ref_ls=0.26,
        verse_px=41, verse_lh=2.10, verse_top=0.2574,
        foot_px=23, foot_ls=0.20,
    ),
    "5x7": dict(
        w=1500, h=2100, per_page=7,
        side=0.10,                          # 좌우 여백 10%
        ref_px=36, ref_ls=0.28, ref_top=0.100,
        verse_px=63, verse_lh=2.12, verse_top=0.2110,
        foot_px=35, foot_ls=0.26, foot_top=0.457,
    ),
    "phone": dict(
        w=1080, h=2340, per_page=6,
        side=0.09,
        ref_px=33, ref_ls=0.28, ref_top=0.294,
        verse_px=51, verse_lh=2.12, verse_top=0.3829,
        foot_px=32, foot_ls=0.26, foot_top=0.570,
    ),
}

INK = "#211D19"
CORAL = "#DC5A51"
PAPER = "#FFFDF8"
INK60 = "rgba(33,29,25,.56)"
PLUM = "#7D5570"       # 그림 위에 얹는 글자색 — 하늘빛에 묻히지 않는 선
DEEP = "#372B34"


try:
    from verses import LINES          # 손으로 정해 준 줄 (없어도 된다)
except ImportError:
    LINES = {}


def fixed(vid: str) -> str:
    """손으로 정해 준 줄이 있으면 그것을 실어 보낸다."""
    ls = LINES.get(vid)
    return f' data-lines="{"|".join(ls)}"' if ls else ""


def lead_em(lh: float) -> float:
    """글줄 상자 위쪽에 남는 몫 (em) — 나눔명조 기준으로 재서 얻은 값이다."""
    return round((lh - 0.9333) / 2, 4)


def data_uri(path: Path) -> str:
    return "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode()


# 줄을 셋으로 나누고 글자를 줄이는 일은 브라우저가 재야 정확하다 —
# 굵은 구간은 같은 글자라도 폭이 다르다.
FIT_JS = r"""
const cv = document.createElement('canvas').getContext('2d');
const M = 200;                       // 재는 기준 크기

/*
 * 줄을 바꿔도 되는 자리인가.
 *
 * 한국어는 뒤엣말이 있어야 앞말이 완성되는 자리가 많다. 「내 마음이 / 그를」
 * 「능히 / 하지」 「이 / 말씀이」 「받을 / 만한」처럼 그 사이를 가르면 읽다가
 * 한 번 멈칫하게 된다. 그래서 어미로 맺힌 자리를 제일로 치고, 조사로 맺힌
 * 자리를 그다음으로, 꾸미는 말과 부사 뒤는 거의 막는다.
 */

/* 절이 맺힌다 — 여기서 끊는 것이 가장 자연스럽다 */
const CLAUSE = /(?:,|고|며|나|니|라|서|여|사|매|면|므로|요|든지|지라도|도다|니라|으라|리니|하며|하고|시니|시며)$/;
/* 조사로 맺혔다 — 끊어도 되지만 절 끝만은 못하다 */
const PARTICLE = /(?:을|를|은|는|에|에서|에게|으로|로|와|과|의)$/;
/* 뒤엣말을 꾸미는 말 — 여기서 끊으면 말이 갈라진다 */
const DET = new Set(['그','이','저','새','온','뭇','각','첫','옛','내','네','제','한','두','세',
                     '모든','온갖','다른','어떤','무슨','큰','작은','많은','좋은','이런','그런']);
const ADV = new Set(['다','능히','오직','더욱','잠잠히','간절히','친히','반드시','항상','이제',
                     '곧','또','함께','서로','크게','잘','늘','매우','심히','두루','날마다',
                     '결코','아직','이미','참으로','마침내','도리어','문득','실로','가히']);
/* 관형형 어미 · 보조적 연결어미 */
const MOD = /(?:한|할|하는|하신|하실|되는|된|있는|없는|같은|주신|주실|계신|오실|이신|신|실|던|지)$/;
/* 앞말에 기대는 말 — 이것들 앞에서 줄이 바뀌면 안 된다 */
const BOUND = new Set(['것','것을','것이','것이라','것이요','바','수','자','때','만한','같이',
                       '함께','대로','만큼','뿐','줄','데','이는']);

/** 이 낱말 뒤에서 줄을 바꾸면 얼마나 어색한가 (0 = 자연스럽다) */
function seam(prev, next) {
  if (DET.has(prev) || ADV.has(prev) || MOD.test(prev)) return 2.5;
  if (next && BOUND.has(next)) return 2.5;
  if (/[이가]$/.test(prev) && prev.length > 1) return 1.6;   // 주어와 서술어를 가른다
  if (CLAUSE.test(prev)) return 0;
  if (PARTICLE.test(prev)) return 0.5;
  return 1.2;
}

function widthOf(toks, i, j) {
  let w = 0;
  for (let k = i; k < j; k++) {
    cv.font = `${toks[k].b ? 700 : 400} ${M}px "Nanum Myeongjo", serif`;
    w += cv.measureText(toks[k].w).width;
    if (k > i) w += cv.measureText(' ').width;
  }
  return w;
}

function fit(el) {
  const text = el.dataset.text, bold = el.dataset.bold || '';
  const at = bold ? text.indexOf(bold) : -1;
  const toks = [];
  for (const [seg, b] of at < 0
      ? [[text, false]]
      : [[text.slice(0, at), false], [bold, true], [text.slice(at + bold.length), false]]) {
    for (const w of seg.split(/\s+/).filter(Boolean)) toks.push({ w, b });
  }

  /*
   * 세 줄로 가르는 자리를 고른다.
   *
   * 글자 크기는 카드마다 같다. 그래서 폭은 「고를 것」이 아니라 「넘으면 안 되는
   * 선」이다 — 넘지 않는 자리 가운데서 가장 자연스럽게 끊기는 데를 고른다.
   *
   * 폭을 값으로 매기면 어색한 자리를 폭으로 살 수 있게 된다. 「믿음, 소망,
   * 사랑, 이 세 / 가지는」처럼 한 낱말이 갈라지는 것이 그렇게 나온다.
   */
  const boxW = el.parentElement.clientWidth;
  const size = +el.dataset.size;
  const limit = boxW / size * M;

  /* 손으로 정해 준 줄이 있으면 그대로 쓴다 — 사람 눈이 규칙보다 낫다 */
  let best = null;
  const fixed = el.dataset.lines;
  if (fixed) {
    const n = fixed.split('|').map((l) => l.trim().split(/\s+/).length);
    const i = n[0], j = n[0] + n[1];
    const ws = [widthOf(toks, 0, i), widthOf(toks, i, j), widthOf(toks, j, toks.length)];
    best = { i, j, cost: 0, maxW: Math.max(...ws), awkward: 0 };
  }

  for (let i = 1; !fixed && i < toks.length - 1; i++) {
    for (let j = i + 1; j < toks.length; j++) {
      const ws = [widthOf(toks, 0, i), widthOf(toks, i, j), widthOf(toks, j, toks.length)];
      const maxW = Math.max(...ws), spread = maxW - Math.min(...ws);
      let awkward = seam(toks[i - 1].w, toks[i].w) + seam(toks[j - 1].w, toks[j].w);
      // 낱말 하나만 덩그러니 남는 줄은 크게 물린다 — 「무엇이든지 / 기도하고 /
      // 구하는 것은 받은 줄로 믿으라」처럼 한쪽으로 쏠리는 것이 그렇게 나온다
      for (const [a, b] of [[0, i], [i, j], [j, toks.length]])
        if (b - a === 1) awkward += 2;
      // 넘치는 것이 먼저, 그다음이 읽히는 자리, 마지막이 줄 고르기
      const cost = Math.max(0, maxW - limit) * 1e6 + awkward * 2500 + spread;
      if (!best || cost < best.cost) best = { i, j, cost, maxW, awkward };
    }
  }
  if (!best) { el.textContent = text; return; }

  el.dataset.width = best.maxW;
  el.dataset.awk = best.awkward;
  el.dataset.over = best.maxW > limit ? '1' : '';
  el.style.fontSize = size + 'px';
  el.innerHTML = [[0, best.i], [best.i, best.j], [best.j, toks.length]].map(([a, b]) => {
    let out = '', open = false;
    for (let k = a; k < b; k++) {
      if (toks[k].b !== open) { out += open ? '</b>' : '<b>'; open = toks[k].b; }
      out += (k > a ? ' ' : '') + toks[k].w;
    }
    return out + (open ? '</b>' : '');
  }).join('<br>');
}

document.fonts.ready.then(() => {
  document.querySelectorAll('.verse').forEach(fit);
  document.documentElement.dataset.ready = '1';
});
"""



# ── 재기 ────────────────────────────────────────────────────────────────
# 글자 크기를 카드마다 다르게 두면 100장을 늘어놓았을 때 들쭉날쭉하다. 크기를
# 고정하려면 구절 길이가 비슷해야 하고, 「비슷하다」는 글자 수가 아니라 실제
# 폭으로 재야 한다 — 한글은 한 글자가 0.84em쯤이고 띄어쓰기는 0.25em쯤이다.
#
#     python design/wordcards/render.py --measure
#
# 세 줄로 갈랐을 때 「가장 긴 줄」이 몇 em인지 구절마다 찍는다.

MEASURE_JS = FIT_JS.replace(
    """document.fonts.ready.then(() => {
  document.querySelectorAll('.verse').forEach(fit);
  document.documentElement.dataset.ready = '1';
});""",
    """document.fonts.ready.then(() => {
  const out = [];
  for (const el of document.querySelectorAll('.verse')) {
    fit(el);
    out.push([el.dataset.id, +(el.dataset.width / 200).toFixed(3),
              el.innerHTML.split('<br>'), +el.dataset.awk]);
  }
  const pre = document.createElement('pre');
  pre.id = 'out';
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
});""")


def measure(rows: list[tuple[str, str, str, str]]) -> list:
    """구절마다 (id, 가장 긴 줄의 폭 em, 세 줄)."""
    r = RATIOS["square"]
    cards = SEP.join(
        f'''<div class="box"><p class="verse" data-id="{vid}" data-text="{text}"
           data-bold="{bold}" data-size="{r['verse_px']}"{fixed(vid)}></p></div>'''
        for vid, _ref, text, bold in rows
    )
    html = f"""<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap" rel="stylesheet">
<style>.box{{width:{r['w'] - r['pad'] * 2 - r['img_w'] - r['gap']}px}}
.verse{{font-family:'Nanum Myeongjo',serif;margin:0}}</style></head>
<body>{cards}<script>{MEASURE_JS}</script></body></html>"""
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "measure.html"
        src.write_text(html, encoding="utf-8")
        done = subprocess.run(
            [str(CHROME), "--headless=new", "--disable-gpu", "--dump-dom",
             "--virtual-time-budget=25000", f"--user-data-dir={tmp}/prof", src.as_uri()],
            check=True, capture_output=True,
        )
    dom = done.stdout.decode("utf-8", "replace")
    a = dom.index('<pre id="out">') + len('<pre id="out">')
    raw = dom[a : dom.index("</pre>", a)]
    for ent, ch in [("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&amp;", "&")]:
        raw = raw.replace(ent, ch)
    return json.loads(raw)


def page_html(ratio: str, rows: list[tuple[str, str, str, str]]) -> str:
    r = RATIOS[ratio]
    w, h = r["w"], r["h"]
    if ratio == "square":
        bg = data_uri(ART / "bg-square.jpg")
        css = f"""
        .card{{position:relative;width:{w}px;height:{h}px;background:{PAPER};
          border:2px solid {INK};box-sizing:border-box;padding:{r['pad']}px;
          display:flex;gap:{r['gap']}px;overflow:hidden}}
        .col{{width:{r['img_w']}px;flex:0 0 auto;overflow:hidden}}
        .col img{{width:100%;height:100%;object-fit:cover;object-position:38% center;display:block}}
        .txt{{flex:1;position:relative;min-width:0}}
        .vwrap{{position:absolute;left:0;right:0;top:{round(r['verse_top']*h) - r['pad']}px}}
        .ref{{font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:{r['ref_px']}px;
          letter-spacing:{r['ref_ls']}em;color:{CORAL};line-height:1}}
        .verse{{font-family:'Nanum Myeongjo',serif;font-weight:400;line-height:{r['verse_lh']};
          color:{INK};margin:0;word-break:keep-all;
          transform:translateY(-{lead_em(r['verse_lh'])}em)}}
        .foot{{position:absolute;left:0;right:0;bottom:0;
          font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:{r['foot_px']}px;
          letter-spacing:{r['foot_ls']}em;color:{INK60};line-height:1.9}}
        .foot span{{font-size:.82em;opacity:.78}}
        """
        body = "\n".join(
            f"""<div class="card"><div class="col"><img src="{bg}"></div>
            <div class="txt"><div class="ref">{ref}</div>
            <div class="vwrap"><p class="verse" data-text="{text}" data-bold="{bold}"
              data-size="{r['verse_px']}"{fixed(vid)}></p></div>
            <div class="foot">2026 MIRACLE<br><span>GIL COMMUNITY</span></div></div></div>"""
            for vid, ref, text, bold in rows
        )
    else:
        bg = data_uri(ART / "bg-tall.jpg")
        pos = "center bottom" if ratio == "phone" else "center"
        side = round(r["side"] * w)
        css = f"""
        .card{{position:relative;width:{w}px;height:{h}px;overflow:hidden;box-sizing:border-box}}
        .card>img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
          object-position:{pos}}}
        .ref{{position:absolute;left:{side}px;right:{side}px;top:{round(r['ref_top']*h)}px;
          text-align:center;font-family:'IBM Plex Mono',monospace;font-weight:500;
          font-size:{r['ref_px']}px;letter-spacing:{r['ref_ls']}em;color:{PLUM};line-height:1}}
        .vwrap{{position:absolute;left:{side}px;right:{side}px;top:{round(r['verse_top']*h)}px;
          text-align:center}}
        .verse{{font-family:'Nanum Myeongjo',serif;font-weight:400;line-height:{r['verse_lh']};
          color:{DEEP};margin:0;word-break:keep-all;
          transform:translateY(-{lead_em(r['verse_lh'])}em)}}
        .foot{{position:absolute;left:{side}px;right:{side}px;top:{round(r['foot_top']*h)}px;
          text-align:center;font-family:'IBM Plex Mono',monospace;font-weight:500;
          font-size:{r['foot_px']}px;letter-spacing:{r['foot_ls']}em;color:{PLUM};line-height:1}}
        .foot span{{font-size:.82em;opacity:.78}}
        """
        body = "\n".join(
            f"""<div class="card"><img src="{bg}">
            <div class="ref">{ref}</div>
            <div class="vwrap"><p class="verse" data-text="{text}" data-bold="{bold}"
              data-size="{r['verse_px']}"{fixed(vid)}></p></div>
            <div class="foot">2026 MIRACLE &middot; <span>GIL COMMUNITY</span></div></div>"""
            for vid, ref, text, bold in rows
        )

    return f"""<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Nanum+Myeongjo:wght@400;700&display=swap" rel="stylesheet">
<style>*{{margin:0;padding:0}}html,body{{background:#fff}}{css}</style></head>
<body>{body}<script>{FIT_JS}</script></body></html>"""


def shoot(html: str, w: int, h: int, png: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "page.html"
        src.write_text(html, encoding="utf-8")
        subprocess.run(
            [str(CHROME), "--headless=new", "--disable-gpu", "--hide-scrollbars",
             "--force-device-scale-factor=1", "--default-background-color=ffffffff",
             f"--window-size={w},{h}", f"--screenshot={png}",
             "--virtual-time-budget=20000", f"--user-data-dir={tmp}/prof",
             src.as_uri()],
            check=True, capture_output=True,
        )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="앞에서 N개만")
    ap.add_argument("--only", nargs="*", default=list(RATIOS), help="비율 고르기")
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--measure", action="store_true", help="그리지 않고 폭만 잰다")
    args = ap.parse_args()

    rows = [(i, ref, text, bold) for i, ref, text, bold in VERSES]
    if args.limit:
        rows = rows[: args.limit]
    if args.measure:
        for vid, w, lines, over in measure(rows):
            print(f"{'넘침' if over else '   '} {w:6.3f}  {vid:10s}  " + " / ".join(
                l.replace("<b>", "").replace("</b>", "") for l in lines))
        return

    out_root = Path(args.out)

    made = {}
    for ratio in args.only:
        r = RATIOS[ratio]
        d = out_root / ratio
        d.mkdir(parents=True, exist_ok=True)
        n = 0
        for start in range(0, len(rows), r["per_page"]):
            chunk = rows[start : start + r["per_page"]]
            total_h = r["h"] * len(chunk)
            with tempfile.TemporaryDirectory() as tmp:
                png = Path(tmp) / "shot.png"
                shoot(page_html(ratio, chunk), r["w"], total_h, png)
                sheet = Image.open(png).convert("RGB")
                if sheet.size != (r["w"], total_h):
                    raise SystemExit(f"{ratio}: 찍힌 크기가 {sheet.size} — 기대는 {(r['w'], total_h)}")
                for k, (vid, *_rest) in enumerate(chunk):
                    box = (0, k * r["h"], r["w"], (k + 1) * r["h"])
                    sheet.crop(box).save(d / f"{vid}.jpg", quality=88, subsampling=1)
                    n += 1
            print(f"  {ratio} {n}/{len(rows)}", flush=True)
        made[ratio] = n
    print(json.dumps(made, ensure_ascii=False))


if __name__ == "__main__":
    main()
