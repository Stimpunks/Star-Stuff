#!/usr/bin/env node
/**
 * check-forced-colors.mjs — does the page survive the READER'S OWN palette?
 *
 * The ninth gate. The others ask what colour is it, what shape is the tag tree,
 * where is it on screen, does it fit the paper, is it in the sitemap, is it
 * findable, did the styling happen, is it in the right place in the list. This one
 * asks whether any of that still holds when the reader replaces every colour on the
 * site with a small high-contrast palette of their own.
 *
 * WHY IT EXISTS
 * Some readers run Windows Contrast themes or an equivalent: the OS substitutes its
 * own foreground, background and link colours for whatever a page declared, and the
 * browser drops box-shadow and background-image on the way. Measured 2026-09-10,
 * this site had NOT ONE RULE for that mode — `grep forced-colors` returned zero
 * across starstuff.css and all 198 pages — and one real class of content was gone:
 *
 *   4,862 SVG labels across 133 pages under AA in the light palette, most between
 *   1.2:1 and 2:1. Chrome does NOT force `fill`/`stroke`, so the diagrams kept the
 *   light ink they were drawn with while the ground under them turned white. Under a
 *   DARK forced palette the same count is 15, which is the tell: the diagrams were
 *   never wrong, the ground moved out from under them. Confirmed by screenshot as
 *   well as by ratio.
 *
 * It is the same shape of fault as "44 of 46 pages printed blank": a whole rendering
 * mode nobody had emulated. No other gate can see it — check-contrast.mjs measures
 * screen and print, and a forced palette is neither.
 *
 * A SECOND CLASS WAS REPORTED AND WAS NOT REAL, AND THAT IS WHY SECTION 1 JUDGES
 * NOTHING. This tool's first version found 229 gradient-clipped headings across 130
 * pages whose computed fill was transparent with no background-image left, the house
 * wordmark among them, and called them invisible. A screenshot showed every one of
 * them rendering: Chrome forces the paint here even when the computed fill does not
 * change. The fix written for it was a no-op on 198 pages and was removed. **Reading
 * a computed property and inferring a rendering is the error this repo is organised
 * against, and this tool committed it in its own first draft.**
 *
 * BOTH PALETTES, ALWAYS.
 * A forced palette can be light OR dark: measured, Chrome reports Canvas #ffffff /
 * CanvasText #000000 under a light contrast theme and Canvas #000000 / CanvasText
 * #ffffff under a dark one. A fix verified in one of them is not verified. This tool
 * runs every page twice and reports the two totals separately, because the failures
 * do not overlap: the invisible glyphs fail in both, and the SVG labels almost
 * entirely in the light one.
 *
 * WHAT IT DELIBERATELY DOES NOT COUNT: SHAPE FILLS.
 * 3,852 shapes fall under 3:1 against the light Canvas, and almost all of them are
 * starfield dots and glows inside the artwork — decoration, whose disappearance is
 * the mode working correctly. Counting them made the first run of this measurement
 * report 96 findings on a page that had one. A shape is a legibility judgement about
 * a drawing, and check-contrast.mjs already declines the same question for the same
 * reason. The count is printed as information, never as a failure.
 *
 * THE EXEMPTION IS A DECLARATION IN THE PAGE, AND IT IS MEASURED, NOT SKIPPED.
 * Some labels sit on a shape the diagram paints for itself, and forcing those to
 * CanvasText is what BREAKS them — 5 below AA in the light palette and 19 in the
 * dark, the elements field guide's colour-coded discs among them. That is the
 * mistake check-contrast.mjs records at the top of its own SVG pass: a probe that
 * only knew the page ground called all 8 of those symbols 1.05:1, and "fixing" them
 * would have erased every symbol. Such a label carries class="fc-own-ground", which
 * starstuff.css turns into forced-color-adjust: none, so it keeps the fill it was
 * drawn with against the shape it was drawn on.
 *
 * This tool's FIRST design skipped an exempted svg, and that was a hole shaped
 * exactly like the fault it exists to find. A diagram can be MIXED — some labels on
 * its own shapes, some on the page ground — and skipping would have silenced every
 * ground-sitting label the moment somebody exempted the svg to fix the others.
 * starlight.html is that diagram: 11 labels on the ground, 4 on its own colour
 * swatches. So nothing is skipped. The exemption changes the computed fill and the
 * measurement then tells the truth either way, which is why the exemption is per
 * LABEL rather than per diagram.
 *
 * The count prints on its own line so a list that grows is a list somebody can
 * question, and there is deliberately NO rule like "skip any svg containing a rect"
 * — that is how a real failure disappears by acquiring a background.
 *
 * Usage
 *   node tools/check-forced-colors.mjs                     # every *.html in the repo root
 *   node tools/check-forced-colors.mjs index.html          # just these
 *   node tools/check-forced-colors.mjs --check             # exit non-zero on any finding
 *   node tools/check-forced-colors.mjs --verbose           # every finding, not the first 8
 *
 * Requires: Google Chrome. Node 22+ (global WebSocket). Local dev tool; Netlify
 * does not run it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9414; // 9411 search index, 9412 contrast, 9413 overlap/classes
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');
const VIEWPORT = { width: 1280, height: 900 };

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));

if (!CHROME) {
  console.error('No Chrome/Chromium found. Install Google Chrome, or edit the CHROME list.');
  process.exit(1);
}

/* Reveal every spread and entry, exactly as check-contrast.mjs does and for the
   same reason: a paged zine shows one .spread of twelve, so measuring the page as
   it loads measures a twelfth of it and reports the other eleven as clean. Details
   are opened too — 401 of them hold card prose. Animations are killed, because a
   fade caught mid-flight reports opacity 0 and would be skipped as invisible. */
const REVEAL = String.raw`(() => {
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}';
  document.head.appendChild(st);
  let n = 0;
  for (const s of document.querySelectorAll('.spread:not(.active)')) { s.classList.add('active'); n++; }
  for (const e of document.querySelectorAll('.entry:not(.open)')) { e.classList.add('open'); n++; }
  for (const d of document.querySelectorAll('details:not([open])')) { d.open = true; n++; }
  return JSON.stringify({ revealed: n });
})()`;

const MEASURE = String.raw`(() => {
  const parse = (s) => {
    if (!s || s === 'none' || s === 'transparent') return null;
    const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.some(Number.isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const round = (n) => Math.round(n * 100) / 100;

  /* Resolve the palette rather than assuming it. The whole point of this mode is
     that the colours are the reader's, and a dark contrast theme inverts every
     assumption a hard-coded white would encode. */
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  probe.style.color = 'Canvas'; const canvas = parse(getComputedStyle(probe).color) || { r: 255, g: 255, b: 255, a: 1 };
  probe.style.color = 'CanvasText'; const canvasText = parse(getComputedStyle(probe).color) || { r: 0, g: 0, b: 0, a: 1 };
  probe.remove();

  const fails = [];
  let checkedClip = 0, checkedSvg = 0, checkedBox = 0, shapesUnderBar = 0, exemptSvgs = 0, exemptLabels = 0;

  /* ── 1. Gradient-clipped headings: COUNTED, NEVER JUDGED ──────────────────────
     There used to be a check here and it produced 229 false positives across 130
     pages. The reasoning was sound and the instrument was wrong: a heading using
     background-clip: text plus -webkit-text-fill-color: transparent takes its colour
     from the fill, forced colours drops the background-image, and the computed fill
     stays rgba(0,0,0,0) — which is *exactly* how 90 elements printed blank on
     2026-08-12. So the probe concluded the glyphs were unpainted.

     They are not. Chrome forces the PAINT under a forced palette even when the
     computed fill is transparent, and the same clip of index.html's masthead is
     pixel-identical with the transparent fill winning the cascade and without it.
     Print genuinely paints the transparent fill; this mode does not. The two look
     the same in getComputedStyle and differ on screen.

     So these elements are counted, so the run says how much of the page is of this
     kind, and no verdict is offered. A REAL check here would sample rendered pixels
     inside each glyph box and compare them to the Canvas; that is a different and
     bigger instrument, and until somebody builds it this is a gap being reported
     rather than cleared. Do not restore a computed-style test. */
  for (const e of document.querySelectorAll('*')) {
    const cs = getComputedStyle(e);
    if ((cs.webkitBackgroundClip || cs.backgroundClip) !== 'text') continue;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim()).join(' ');
    if (!own || !vis(e) || parseFloat(cs.opacity) === 0) continue;
    checkedClip++;
  }

  /* ── 2. SVG labels, against what is ACTUALLY behind them ──────────────────── */
  const svgs = [...document.querySelectorAll('svg')];
  for (const svg of svgs) {
    if (!vis(svg)) continue;
    if (getComputedStyle(svg).forcedColorAdjust === 'none') exemptSvgs++;
    for (const t of svg.querySelectorAll('text, tspan')) {
      const own = [...t.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent.trim()).join(' ');
      if (!own) continue;
      const cs = getComputedStyle(t);
      const f = parse(cs.fill); if (!f) continue;
      const fo = parseFloat(cs.fillOpacity), op = parseFloat(cs.opacity);
      const a = f.a * (Number.isNaN(fo) ? 1 : fo) * (Number.isNaN(op) ? 1 : op);
      if (a <= 0.05) continue;
      checkedSvg++;
      /* An exempted label is COUNTED, NOT SKIPPED. Skipping was this tool's own
         first design and it was a hole exactly the shape of the fault the tool
         exists to find: a mixed diagram — some labels on its own shapes, some on
         the page ground — would have every one of its ground-sitting labels go
         unmeasured the moment somebody exempted the svg to fix the others.
         starlight.html is that diagram, with 11 labels on the ground and 4 on its
         own swatches. So the exemption changes the computed fill and the
         measurement below then tells the truth about it either way. */
      if (cs.forcedColorAdjust === 'none') exemptLabels++;

      /* Composite the shapes actually painted behind the glyphs — the same rule
         check-contrast.mjs encodes: only shapes EARLIER in document order (SVG
         paints in order), and only rect/circle/ellipse, because a <path> bounding
         box claims area the path never paints and trusting it would invent
         backgrounds and mask real failures.

         This is not optional here. A label on a surviving coloured shape is the
         case where forcing the fill BREAKS it, and a probe that composited only
         the page ground would report the fix as a clean pass. */
      let bg = canvas;
      const r = t.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (const sh of svg.querySelectorAll('rect, circle, ellipse')) {
        if (t.compareDocumentPosition(sh) & Node.DOCUMENT_POSITION_FOLLOWING) continue;
        const b = sh.getBoundingClientRect();
        if (!(cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom)) continue;
        const scs = getComputedStyle(sh);
        const sf = parse(scs.fill); if (!sf) continue;
        const sfo = parseFloat(scs.fillOpacity), sop = parseFloat(scs.opacity);
        const sa = sf.a * (Number.isNaN(sfo) ? 1 : sfo) * (Number.isNaN(sop) ? 1 : sop);
        if (sa <= 0) continue;
        bg = over({ ...sf, a: Math.min(1, Math.max(0, sa)) }, bg);
      }

      const px = parseFloat(cs.fontSize) || 12;
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const need = px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
      const fg = a < 1 ? over({ ...f, a }, bg) : f;
      const rr = ratio(fg, bg);
      if (rr < need) fails.push({ kind: 'svg-label', tag: t.tagName, text: own.slice(0, 46),
        px: Math.round(px), ratio: round(rr), need, fill: cs.fill,
        bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')',
        onShape: ratio(bg, canvas) > 1.05,
        svgCls: String(svg.getAttribute('class') || '(no class)') });
    }
    /* Information only — see the header. */
    for (const sh of svg.querySelectorAll('rect, circle, ellipse')) {
      const b = sh.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const cs = getComputedStyle(sh);
      const f = parse(cs.fill); if (!f) continue;
      const fo = parseFloat(cs.fillOpacity), op = parseFloat(cs.opacity);
      const a = f.a * (Number.isNaN(fo) ? 1 : fo) * (Number.isNaN(op) ? 1 : op);
      if (a > 0.5 && ratio(over({ ...f, a: Math.min(1, a) }, canvas), canvas) < 3) shapesUnderBar++;
    }
  }

  /* ── 3. A box whose only boundary was a shadow ────────────────────────────── */
  const borderless = (cs) => ['Top', 'Right', 'Bottom', 'Left'].every((s) =>
    cs['border' + s + 'Style'] === 'none' || parseFloat(cs['border' + s + 'Width']) === 0);
  for (const e of document.querySelectorAll('div, section, aside, figure, article, details, td, th, table, nav, footer, header, button, summary, blockquote')) {
    if (!vis(e)) continue;
    const cs = getComputedStyle(e);
    /* box-shadow is forced to none, so a computed shadow here means the page still
       asks for one and the browser is about to drop it. */
    const hadShadow = cs.boxShadow && cs.boxShadow !== 'none';
    if (!hadShadow) continue;
    checkedBox++;
    const outlined = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    if (borderless(cs) && !outlined) fails.push({ kind: 'edge', tag: e.tagName.toLowerCase(),
      cls: String(e.className || '').slice(0, 40), why: 'box-shadow was its only boundary' });
  }

  return JSON.stringify({ fails, checkedClip, checkedSvg, checkedBox, shapesUnderBar,
    exemptSvgs, exemptLabels,
    canvas: [canvas.r, canvas.g, canvas.b].map(Math.round),
    canvasText: [canvasText.r, canvasText.g, canvasText.b].map(Math.round) });
})()`;

async function withPage(fileUrl, fn) {
  const t = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  try { return await fn(send); } finally {
    try { ws.close(); } catch {}
    await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
  }
}

/* Unwrap Runtime.evaluate and fail loudly: an in-page exception comes back with no
   value at all, and swallowing it reports a perfect zero for a page never measured. */
function evaluated(msg, what) {
  const r = msg && msg.result;
  if (!r || r.exceptionDetails) throw new Error(`${what} threw in-page: ${JSON.stringify(r && r.exceptionDetails).slice(0, 500)}`);
  if (!r.result || r.result.value === undefined) throw new Error(`${what} returned no value`);
  return JSON.parse(r.result.value);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Wait on a condition, never a clock — build-search-index.mjs lost exactly this
   race on local files (629 records against 637, exit 0, no warning). */
async function settle(send) {
  let last = -1;
  for (let i = 0; i < 100; i++) {
    const p = evaluated(await send('Runtime.evaluate', {
      expression: 'JSON.stringify({r:document.readyState,n:document.body?document.body.textContent.length:0})',
      returnByValue: true,
    }), 'readiness probe');
    if (p.r === 'complete' && p.n === last) return p.n;
    last = p.n;
    await sleep(150);
  }
  return null;
}

function resolveTargets() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!args.length) return fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
  return args.map((a) => {
    if (fs.existsSync(path.resolve(a))) return path.relative(ROOT, path.resolve(a));
    if (fs.existsSync(path.join(ROOT, path.basename(a)))) return path.basename(a);
    console.error(`No such file: ${a}`);
    process.exit(1);
  });
}

function detail(f) {
  if (f.kind === 'svg-label') {
    return `      ${String(f.ratio).padStart(5)}:1 (need ${f.need})  svg ${f.tag} ${f.px}px in .${f.svgCls}\n` +
      `        ${f.fill} on ${f.bg}${f.onShape ? ' — on a shape the browser left alone; the diagram may want class="fc-own-ground"' : ' — on the reader\'s Canvas'}\n` +
      `        "${f.text}"`;
  }
  return `      no edge    <${f.tag}${f.cls ? '.' + f.cls.split(/\s+/).join('.') : ''}>  ${f.why}`;
}

async function main() {
  const files = resolveTargets();
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-forced-'), 'profile')}`, 'about:blank',
  ], { stdio: 'ignore' });

  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); }
  }

  const results = [];
  /* Kept apart from the findings on purpose: zero failures out of zero elements is
     not a clean page, it is a page nobody looked at — the UNREAD fault
     check-contrast.mjs records. A page dropping out silently removes its failures
     from the total, so the number goes DOWN and reads as an improvement. */
  const unread = [];
  let totals = { light: 0, dark: 0 }, shapes = 0, exemptSvgs = 0, exemptLabels = 0, clips = 0;

  try {
    for (const f of files) {
      let out;
      try {
        out = await withPage(`file://${path.join(ROOT, f)}`, async (send) => {
          await send('Page.enable');
          await send('Emulation.setDeviceMetricsOverride', {
            width: VIEWPORT.width, height: VIEWPORT.height, deviceScaleFactor: 1, mobile: false,
          });
          const settledChars = await settle(send);
          evaluated(await send('Runtime.evaluate', { expression: REVEAL, returnByValue: true }), 'reveal');

          /* Both palettes. A forced theme can be light or dark, the failures do not
             overlap, and a fix verified in one of them is not verified. */
          const per = {};
          for (const scheme of ['light', 'dark']) {
            await send('Emulation.setEmulatedMedia', { features: [
              { name: 'forced-colors', value: 'active' },
              { name: 'prefers-color-scheme', value: scheme },
            ] });
            await sleep(300);
            per[scheme] = evaluated(await send('Runtime.evaluate', { expression: MEASURE, returnByValue: true }),
              `measure (${scheme} palette)`);
          }
          await send('Emulation.setEmulatedMedia', { features: [] });
          return { ...per, settledChars };
        });
      } catch (e) {
        unread.push([f, e.message.slice(0, 140)]);
        console.log(`  UNREAD ${f.padEnd(46)} ${e.message.slice(0, 60)}`);
        continue;
      }

      results.push([f, out]);
      const nL = out.light.fails.length, nD = out.dark.fails.length;
      totals.light += nL; totals.dark += nD;
      shapes += out.light.shapesUnderBar;
      clips += out.light.checkedClip;
      exemptSvgs += out.light.exemptSvgs; exemptLabels += out.light.exemptLabels;

      const measured = out.light.checkedClip + out.light.checkedSvg + out.light.checkedBox
        + out.light.exemptLabels;
      if (out.settledChars === null) {
        unread.push([f, 'never settled — readyState/text length still changing after 15s']);
        console.log(`  UNREAD ${f.padEnd(46)} never settled`);
        continue;
      }
      /* A page with no gradient heading, no SVG label and no shadowed box has
         nothing here to get wrong, and that is a real pass — ls-broadside.html is
         one. Only a page with TEXT and nothing measurable is suspicious. */
      if (measured === 0 && out.settledChars > 0) {
        console.log(`  ok     ${f.padEnd(46)} nothing to measure (no clipped text, no svg labels, no shadows)`);
        continue;
      }

      const verdict = nL + nD ? 'FAIL  ' : 'ok    ';
      console.log(`  ${verdict} ${f.padEnd(46)} light ${String(nL).padStart(4)} · dark ${String(nD).padStart(4)}`
        + `   [clipped ${out.light.checkedClip}, svg labels ${out.light.checkedSvg}, boxes ${out.light.checkedBox}`
        + `${out.light.exemptSvgs ? `, ${out.light.exemptSvgs} svg exempt` : ''}]`);

      if (nL + nD) {
        /* Report per palette, because the same page can fail differently in each and
           collapsing them hides which fix is wanted. */
        for (const pal of ['light', 'dark']) {
          const fl = out[pal].fails;
          if (!fl.length) continue;
          console.log(`    ${pal} palette — Canvas rgb(${out[pal].canvas.join(',')}), CanvasText rgb(${out[pal].canvasText.join(',')})`);
          const show = VERBOSE ? fl : fl.slice(0, 8);
          for (const x of show) console.log(detail(x));
          if (fl.length > show.length) console.log(`      … and ${fl.length - show.length} more (--verbose)`);
        }
      }
    }
  } finally {
    chrome.kill();
  }

  const total = totals.light + totals.dark;
  console.log(`\n  ${results.length} page(s) measured · ${total} finding(s)`
    + ` — ${totals.light} in the light palette, ${totals.dark} in the dark one`);
  console.log(`  ${exemptLabels} label(s) carry class="fc-own-ground" (${exemptSvgs} whole svg(s) do)`
    + ` — measured, not skipped: each keeps the fill it was drawn with, against the shape it was drawn on`);
  console.log(`  ${shapes} shape fill(s) under 3:1 against the light Canvas — information, not findings:`
    + `\n    starfield dots and glows inside the artwork, whose disappearance is the mode working`);
  console.log(`  ${clips} gradient-clipped text element(s) counted and NOT judged — Chrome forces their`
    + `\n    paint even though the computed fill stays transparent; see section 1 for why a`
    + `\n    computed-style test here gave 229 false positives, and what a real one would need`);

  if (unread.length) {
    console.log(`\n  UNREAD ${unread.length} page(s) — not a pass, an absent measurement:`);
    for (const [f, why] of unread) console.log(`    ${f}: ${why}`);
  }

  if (CHECK && (total || unread.length)) {
    console.error('\nFAIL — a reader who replaces our palette with their own is getting less of this'
      + '\npage than we think we are serving. The baseline is 0. An svg label on the reader\'s'
      + '\nCanvas needs CanvasText; one set on a shape the diagram paints for itself needs'
      + '\nclass="fc-own-ground" instead, because forcing that one is what breaks it. Verify in'
      + '\nBOTH palettes, and with a screenshot as well as a ratio.');
    process.exit(1);
  }
  if (!CHECK) console.log('\n(informational run — use --check to gate on it)');
}

main().catch((e) => { console.error(e); process.exit(1); });
