#!/usr/bin/env node
/**
 * check-overlap.mjs — finds text sitting on top of other text at render size.
 *
 * WHY THIS EXISTS
 * On 2026-08-14, No. 48 (the-shadow-is-bigger-zine.html) was built and shipped
 * with three real text collisions, every one of them found by a person squinting
 * at a screenshot:
 *
 *   1. The cover motif carried a "nobody took this picture" caption at y=168 in
 *      its viewBox. The cover is 520px tall and .cover-title sits at its foot, so
 *      at render size the caption ran straight through the title.
 *   2. The motif's three-line label stack sat at y=70/90/106 and ran through the
 *      .cover-corner block — the ghosted 48 and its "Star Stuff" label. Nudged
 *      down, it then landed on the .cover-issue line instead.
 *   3. Figure 8's two-line "never / seen" label overlapped itself: two <text>
 *      elements too close together for their own font size.
 *
 * ALL FIVE EXISTING GATES PASSED IT CLEAN, and none of them was wrong to.
 * check-contrast.mjs measures colour, and both strings were perfectly legible —
 * it has no opinion about where they are. check-markup.mjs reads source, where
 * two elements 300 lines apart have no spatial relationship at all. The search
 * index read every word, because every word was there. check-sheets.mjs is about
 * paper fitting, check-sitemap.mjs about a file that lists URLs. A collision is
 * invisible to all of them by construction: it is not a colour, not a tag tree,
 * not a word, not a page count. It is a *position*, and until this file nothing
 * in the repo looked at one.
 *
 * The zine's own source already carries a warning comment — "anything past y≈240
 * in this viewBox lands on the words" — which is the tell. A comment is a note to
 * whoever reads that file next. It is not a control, it does not run, and the
 * next hand-authored diagram gets a fresh chance to make the same mistake.
 *
 * WHY IT NEEDS A BROWSER
 * Same answer as check-contrast.mjs and build-search-index.mjs: you cannot
 * compute this from source. `y="168"` in a viewBox is not a position on a screen
 * until you know the viewBox, the rendered width of the <svg>, the CSS that
 * placed it, the font that shaped the glyphs and the layout of everything it
 * might land on. Only a real layout knows.
 *
 * ── HOW IT MEASURES, and the one thing that makes it usable ──────────────────
 * INKED EXTENT, NOT THE ELEMENT BOX. The throwaway prototype this grew from
 * compared getBoundingClientRect() of block-level elements, and drowned in false
 * positives — .cover-issue is a full-width block whose text ends far short of its
 * right edge, so any motif label in the empty half was "colliding" with a line it
 * visibly clears. The prototype tried to filter that with "ignore boxes wider than
 * 92% of the host", which is a proxy for the real question and not a good one:
 * .cover-issue measures 87%. So it stayed.
 *
 * The real question is where the ink is, so that is what gets measured. Every
 * HTML text NODE is wrapped in a Range and asked for getClientRects(), which
 * returns one rect per rendered line fragment, ending exactly where the glyphs
 * end. Text nodes rather than elements also disposes of the other obvious false
 * positive for free: a <span> inside a <p> overlaps its parent's box completely
 * and always, but their text nodes are disjoint.
 *
 * Vertically, a line-fragment rect is the LINE BOX, which is taller than the
 * glyphs whenever line-height exceeds 1 — and half-leading is empty space a
 * neighbour is entitled to use. Two real examples on every zine cover:
 * .cover-corner-label sets margin-top:-0.3rem to tuck under .cover-corner-num, and
 * the .diagram-note lines sit tight under their figures. Both are correct, and both
 * "overlap" if you trust the line box. So each rect is shrunk to an em box
 * (INK_RATIO × font-size) centred in the line box before anything is compared.
 * That is an approximation of the glyph extent, and a deliberately generous one:
 * it can only under-report, and an under-reported collision is a thing a human
 * still has to notice, where an over-reported one is a gate nobody reads.
 *
 * MIN_OVERLAP then requires the intersection to be a real one in BOTH axes,
 * scaled to the smaller of the two font sizes. Kerning overhang, italic overhang
 * and antialiasing all put a fraction of a pixel of one glyph inside another's box
 * on pages that are perfectly fine.
 *
 * WHAT IT REPORTS, in three kinds:
 *   svg-vs-svg    two labels in one diagram on top of each other (fault 3)
 *   svg-vs-html   a diagram label on the page's own prose (faults 1 and 2)
 *   html-vs-html  two pieces of page text on each other — the same fault with no
 *                 SVG involved, reachable through absolute positioning, a negative
 *                 margin or a transform
 *   clipped       text extending outside an overflow:hidden ancestor, or outside
 *                 its own <svg> viewport, where the reader gets a sentence with
 *                 the end sliced off. Not a collision, but the same class of
 *                 fault — hand-placed text landing where it does not fit — and
 *                 found by the same measurement.
 *
 * WHAT IT DOES NOT MEASURE, deliberately
 *   · PRINT. Paper is a different layout at a different width, and check-sheets.mjs
 *     already owns "does this land on the page". Adding a print pass here would
 *     double the surface for a fault class not yet observed on paper. If one turns
 *     up, add the pass rather than assuming this covered it.
 *   · One viewport. 1280×900, the same fixed desktop viewport check-contrast.mjs
 *     uses, so a run is reproducible and @media rules resolve the same way every
 *     time. A collision that only happens at 380px is real and this will not see
 *     it.
 *   · Text over non-text. A label on a line, an arrowhead through a word: those
 *     are legibility judgements about artwork, and CLAUDE.md is right that a human
 *     has to check a diagram at render size. This checks the part that is
 *     mechanical.
 *
 * USAGE
 *   node tools/check-overlap.mjs                            # every *.html in the repo root
 *   node tools/check-overlap.mjs the-shadow-is-bigger-zine.html   # just these
 *   node tools/check-overlap.mjs --check                    # exit non-zero on any collision
 *
 * --check is the gating mode, matching its four siblings. A plain run always exits
 * 0 so an informational pass doesn't read as a crash. It prints a line per page,
 * pass or fail, with the count of text boxes actually measured — the lesson every
 * other tool here learned separately: when the only output is "it worked", a page
 * that measured none of itself looks exactly like a clean one.
 *
 * BASELINE: 0, established by sweeping all 102 pages on 2026-08-14. Keep it there.
 * A gate that ships with a non-zero baseline has to be read past to find the real
 * number, and then it stops being read.
 *
 * Requires: Google Chrome installed. Node 22+ (uses the global WebSocket).
 * Netlify does not run this; local dev tool, same as its siblings.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9414; // 9411 search-index, 9412 contrast, 9413 sheets — one each, so they can run together
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');

/* The same fixed viewport check-contrast.mjs measures at, for the same reasons:
   reproducibility, and so @media width rules resolve to the desktop layout every
   run. See "what it does not measure" above. */
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

/* Lifted from check-contrast.mjs, and for the identical reason: a paged zine shows
   one .spread at a time and field guides render entries collapsed, so measuring the
   page as it loads measures spread 1 of 12. Every other spread reports zero
   collisions because it reported nothing at all. Fault 3 above was on spread 8.

   Animations are killed rather than waited out — a transform caught mid-flight is a
   position no reader ever sees, in either direction: it can invent a collision or
   hide one. */
const REVEAL = String.raw`(() => {
  const st = document.createElement('style');
  st.id = 'ss-overlap-still';
  st.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}';
  document.head.appendChild(st);
  let spreads = 0, entries = 0;
  for (const s of document.querySelectorAll('.spread:not(.active)')) { s.classList.add('active'); spreads++; }
  for (const e of document.querySelectorAll('.entry:not(.open)')) { e.classList.add('open'); entries++; }
  for (const d of document.querySelectorAll('details:not([open])')) d.open = true;
  return JSON.stringify({ spreads, entries });
})()`;

const MEASURE = String.raw`((cfg) => {
  const { INK_RATIO, MIN_OVERLAP, MIN_PX, CLIP_TOL } = cfg;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ── boxes ────────────────────────────────────────────────────────────────
     One entry per rendered line fragment of text. Each carries the font size it
     is set in, because every tolerance below is scaled to it: 2px of overlap is a
     catastrophe at 5.5px type and invisible at 72px. */
  const boxes = [];

  const clean = (s) => String(s).replace(/\s+/g, ' ').trim();

  /* Shrink a line box to the ink it plausibly contains. See the header: the line
     box includes half-leading, which is empty space the next element is entitled
     to occupy, and trusting it flags .cover-corner-label on all 40 zine covers. */
  const push = (rect, em, el, text, kind) => {
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    if (em < MIN_PX) return;
    const h = Math.min(rect.height, em * INK_RATIO);
    const cy = rect.top + rect.height / 2;
    boxes.push({
      l: rect.left, r: rect.right, t: cy - h / 2, b: cy + h / 2,
      em, el, kind,
      text: clean(text).slice(0, 46),
    });
  };

  const hidden = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
      if (parseFloat(cs.opacity) === 0) return true;
    }
    return false;
  };

  /* ── 1. HTML text nodes ───────────────────────────────────────────────────
     Nodes, not elements. An element box is the wrong shape twice over: it spans
     the full column width when the text does not (the .cover-issue false positive
     that made the prototype unusable), and it contains its descendants' boxes, so
     every <span> in a <p> is a guaranteed hit. A text node's Range rects are the
     glyphs and nothing else. */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!clean(n.textContent)) continue;
    const el = n.parentElement;
    if (!el || el.namespaceURI === SVG_NS) continue; // SVG handled below, with its own geometry
    if (el.closest('script,style,title,head')) continue;
    if (hidden(el)) continue;
    const em = parseFloat(getComputedStyle(el).fontSize);
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) push(r, em, el, n.textContent, 'html');
  }

  /* ── 2. SVG text ──────────────────────────────────────────────────────────
     <text>, not <tspan>: a tspan's rect is contained by its parent text's, so
     measuring both guarantees a self-hit on every multi-tspan label in the repo.
     getBoundingClientRect on SVG text is already the glyph bbox — no Range needed
     — but it is scaled by the viewBox, so the em size has to be scaled with it or
     every tolerance below is computed in the wrong units. */
  for (const svg of document.querySelectorAll('svg')) {
    if (hidden(svg)) continue;
    const sr = svg.getBoundingClientRect();
    if (!sr.width || !sr.height) continue;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const scale = vb && vb.width ? sr.width / vb.width : 1;
    for (const t of svg.querySelectorAll('text')) {
      const text = clean(t.textContent);
      if (!text) continue;
      if (hidden(t)) continue;
      const em = parseFloat(getComputedStyle(t).fontSize) * scale;
      push(t.getBoundingClientRect(), em, t, text, 'svg');
    }
  }

  /* ── 3. pairwise ──────────────────────────────────────────────────────────
     Sorted by top edge and swept, so the inner loop breaks as soon as a box
     starts below the current one's bottom. Brute force is O(n²) on pages with
     3,000 text fragments; the sweep makes a full-repo run seconds rather than
     minutes, and gives the identical answer because the comparison requires
     vertical overlap anyway. */
  boxes.sort((a, b) => a.t - b.t);

  const hits = [];
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j];
      if (b.t >= a.b) break; // sorted: nothing after this can overlap a vertically

      /* Tolerance scaled to the smaller type. A 2px intrusion is most of a 5.5px
         label and nothing at all on a 72px cover title. Both axes must clear it:
         glyph overhang from kerning, italics and letter-spacing routinely puts a
         sliver of one box inside another on pages that are perfectly fine. */
      const tol = Math.max(0.75, MIN_OVERLAP * Math.min(a.em, b.em));
      const dx = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      if (dx <= tol) continue;
      const dy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (dy <= tol) continue;

      /* Same element twice is a wrapped line, not a collision, and a text node
         next to its own inline sibling on the same line is normal flow. Only
         genuinely separate boxes count. */
      if (a.el === b.el) continue;

      hits.push({
        kind: a.kind === b.kind ? a.kind + '-vs-' + b.kind : 'svg-vs-html',
        a: a.text, b: b.text,
        aSel: sel(a.el), bSel: sel(b.el),
        dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10,
        where: locate(a.el),
      });
    }
  }

  /* ── 4. clipped ───────────────────────────────────────────────────────────
     Text running outside something that cuts it off. Two hosts count, and both
     are real: the nearest ancestor that actually computes overflow hidden/clip,
     and — for SVG text — the <svg> viewport itself, which clips by UA default
     once it has a viewBox. A hand-placed label at y=168 in a 340-unit box stays
     inside; the same label in a 120-unit box is sliced, and nothing else here
     would say so.

     The tolerance is a fraction of the type size, not a pixel count, because the
     thing it has to absorb scales with the type: getBBox reports the glyph ADVANCE
     box, which includes side bearings — empty space inside the box that no ink
     occupies. A monospace quote mark's trailing bearing is a sixth of an em of
     nothing. CLIP_TOL sits between the two cases actually measured here rather
     than being picked: the-lines-we-drew-zine.html lost 0.86em off the left of
     "light-years" and the reader got "ight-years", while
     why-difference-comes-first-zine.html had 0.22em of a closing quote's bearing
     past the edge with the glyph itself intact. */
  const clipped = [];
  const CLIP = new Set(['hidden', 'clip']);
  for (const box of boxes) {
    const el = box.el;
    let host = null;
    if (box.kind === 'svg') {
      /* A viewBox'd <svg> clips at its viewport by UA default, so it is a clip host
         unless the page explicitly said overflow:visible — which several diagrams
         here do, on purpose, to let a stroke breathe past the edge. Honour that. */
      const svg = el.ownerSVGElement;
      if (svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) {
        const cs = getComputedStyle(svg);
        if (CLIP.has(cs.overflowX) || CLIP.has(cs.overflowY)) host = svg;
      }
    }
    if (!host) {
      for (let n = el.parentElement; n && n.nodeType === 1; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (CLIP.has(cs.overflowX) || CLIP.has(cs.overflowY)) { host = n; break; }
      }
    }
    if (!host) continue;
    const h = host.getBoundingClientRect();
    if (!h.width || !h.height) continue;
    const out = Math.max(h.left - box.l, box.r - h.right, h.top - box.t, box.b - h.bottom);
    if (out > Math.max(1, CLIP_TOL * box.em)) {
      clipped.push({
        text: box.text, sel: sel(el), by: Math.round(out * 10) / 10,
        em: Math.round((out / box.em) * 100) / 100,
        host: sel(host), where: locate(el),
      });
    }
  }

  function sel(el) {
    if (!el || !el.tagName) return '?';
    const c = el.getAttribute && el.getAttribute('class');
    const cls = c && typeof c === 'string' ? '.' + c.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + cls;
  }
  function locate(el) {
    const s = el.closest && el.closest('.spread');
    return (s && s.id) || 'page';
  }

  return JSON.stringify({ boxes: boxes.length, hits, clipped });
})`;

/* ─── minimal CDP client — same shape as check-contrast.mjs ─────────────────── */
async function withPage(fileUrl, fn) {
  const t = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  try {
    return await fn(send);
  } finally {
    try { ws.close(); } catch {}
    await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
  }
}

/* Unwrap Runtime.evaluate and fail loudly. An in-page exception comes back as
   exceptionDetails with no value; swallowing it would report a perfect
   zero-collision page for a page that was never measured. */
function evaluated(msg, what) {
  const r = msg && msg.result;
  if (!r || r.exceptionDetails) {
    throw new Error(`${what} threw in-page: ${JSON.stringify(r && r.exceptionDetails).slice(0, 600)}`);
  }
  if (!r.result || r.result.value === undefined) {
    throw new Error(`${what} returned no value: ${JSON.stringify(msg).slice(0, 600)}`);
  }
  return JSON.parse(r.result.value);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait on a CONDITION, never on a clock — the house rule, and the prototype broke
 * it with a flat sleep(400). build-search-index.mjs lost exactly this race on
 * local files (629 records against 637, exit 0, no warning), so "local is fast
 * enough" is already disproven in this repo. Returns the settled text length, or
 * null if it never settled — it does not throw, because abandoning the remaining
 * pages to report one bad one is a worse trade.
 */
async function settle(send) {
  let last = -1;
  for (let i = 0; i < 100; i++) {
    const p = evaluated(
      await send('Runtime.evaluate', {
        expression:
          'JSON.stringify({r:document.readyState,n:document.body?document.body.textContent.length:0})',
        returnByValue: true,
      }),
      'readiness probe'
    );
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

/* The tuning, in one place and named, because these three numbers are the whole
   difference between a gate and a noise generator — and because the next person to
   widen one should have to look at the comment above it.

   INK_RATIO   fraction of font-size treated as glyph height inside the line box.
               0.8 is roughly cap-height plus descender for the faces here. Higher
               flags half-leading; lower starts missing real overlaps.
   MIN_OVERLAP required intersection in BOTH axes, as a fraction of the smaller
               font size. 0.22 clears kerning and italic overhang and still fires
               on the reconstructed No. 48 faults with room to spare.
   MIN_PX      ignore type below this. Nothing readable is under 3px; what is down
               there is measuring marks and hit targets.
   CLIP_TOL    how far outside a clipping box text may sit, as a fraction of its own
               font size, before it counts as cut off. Absorbs the glyph advance
               box's side bearings. See the clipped section for the two measured
               cases either side of it. */
const CFG = { INK_RATIO: 0.8, MIN_OVERLAP: 0.22, MIN_PX: 3, CLIP_TOL: 0.25 };

async function main() {
  const files = resolveTargets();

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-overlap-'), 'profile')}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); }
  }

  const results = [];
  /* Kept apart from the findings, never folded into them. A page that measured
     nothing reports zero collisions, which in a 102-line list is indistinguishable
     from a clean page — and at a baseline of 0 it is *especially* indistinguishable,
     because both print "ok". check-contrast.mjs learned this one first. */
  const unread = [];

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
          await sleep(120);
          const m = evaluated(
            await send('Runtime.evaluate', {
              expression: `(${MEASURE})(${JSON.stringify(CFG)})`,
              returnByValue: true,
            }),
            'overlap measure'
          );
          return { ...m, settledChars };
        });
      } catch (e) {
        unread.push([f, String(e.message || e).slice(0, 140)]);
        console.log(`  ${f.padEnd(44)} UNREAD  ${String(e.message || e).slice(0, 60)}`);
        continue;
      }

      results.push([f, out]);

      let notMeasured = true;
      if (out.settledChars === null) {
        unread.push([f, 'never settled — readyState/text length still changing after 15s']);
      } else if (out.boxes === 0) {
        unread.push([f, out.settledChars === 0
          ? 'loaded with no text at all'
          : 'measured 0 text boxes despite having text — check the reveal step']);
      } else {
        notMeasured = false;
      }

      const n = out.hits.length + out.clipped.length;
      console.log(
        `  ${f.padEnd(44)} ${notMeasured ? 'UNREAD' : n ? 'FAIL  ' : 'ok    '}` +
          `  ${String(out.boxes).padStart(5)} text boxes` +
          (out.hits.length ? `  ${out.hits.length} collision(s)` : '') +
          (out.clipped.length ? `  ${out.clipped.length} clipped` : '')
      );
      for (const h of out.hits.slice(0, VERBOSE ? 999 : 8)) {
        console.log(
          `      ${h.where.padEnd(9)} ${h.kind.padEnd(12)} ${h.dx}×${h.dy}px overlap\n` +
            `        "${h.a}" <${h.aSel}>\n        "${h.b}" <${h.bSel}>`
        );
      }
      if (!VERBOSE && out.hits.length > 8) console.log(`      … ${out.hits.length - 8} more`);
      for (const c of out.clipped.slice(0, VERBOSE ? 999 : 8)) {
        console.log(
          `      ${c.where.padEnd(9)} clipped      ${c.by}px (${c.em}em) outside <${c.host}>\n        "${c.text}" <${c.sel}>`
        );
      }
      if (!VERBOSE && out.clipped.length > 8) console.log(`      … ${out.clipped.length - 8} more`);
    }
  } finally {
    chrome.kill();
  }

  const hits = results.reduce((a, [, o]) => a + o.hits.length, 0);
  const clipped = results.reduce((a, [, o]) => a + o.clipped.length, 0);
  const boxes = results.reduce((a, [, o]) => a + o.boxes, 0);

  console.log(
    `\n${results.length} page(s) · ${boxes.toLocaleString()} text boxes measured at ` +
      `${VIEWPORT.width}×${VIEWPORT.height} · ${hits} collision(s), ${clipped} clipped`
  );

  /* Its own block, above the verdict. An unmeasured page is a broken RUN, not a
     clean page, and it gates separately for the same reason it does in
     check-contrast.mjs. */
  if (unread.length) {
    console.error(`\n${unread.length} page(s) WERE NOT MEASURED. Nothing above counts for these:`);
    for (const [f, why] of unread) console.error(`  ${f.padEnd(44)} ${why}`);
  }

  const problems = hits + clipped;
  if (CHECK) {
    if (unread.length) {
      console.error(`\nFAIL — ${unread.length} page(s) not measured; the run is incomplete.`);
      process.exit(1);
    }
    if (problems) {
      console.error(
        `\nFAIL — ${problems} place(s) where text lands on other text, or outside the box that\n` +
          'clips it. Move the text; do not shrink it until it happens to miss.'
      );
      process.exit(1);
    }
    console.log('\nPASS — no text sits on other text, and nothing is clipped by its own container.');
    process.exit(0);
  }
  if (problems) console.log(`\n${problems} problem(s). Run with --check to make this gate a ship.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
