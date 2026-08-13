#!/usr/bin/env node
/**
 * check-contrast.mjs — measures WCAG text contrast on every page, on SCREEN and
 * under PRINT emulation.
 *
 * WHY THIS EXISTS
 * CLAUDE.md says three things that only mean something if a script enforces them:
 * "Print is not optional, and it is not free", "Verify, don't assume", and "A
 * stated principle nobody measures is a wish." Before this file, the measurement
 * was rewritten as a throwaway scratchpad script every time it was needed — which
 * is why 44 of 46 pages once printed blank, and why 226 SVG labels across 27 pages
 * sat under 4.5:1 until commit bf317cd went looking. A check that has to be
 * re-derived from scratch is a check nobody runs.
 *
 * WHAT IT MEASURES
 *   1. Every HTML element with its own text, composited against its *real*
 *      ancestor background stack — not against the token you assume applies.
 *   2. Every SVG <text>/<tspan> fill, composited against the shapes actually
 *      painted behind it. `color` never reaches `fill`, so the CSS pass is blind
 *      to diagrams; this is the pass that would have caught bf317cd.
 *   3. Both of the above again with Emulation.setEmulatedMedia {media:'print'} —
 *      where a page that hardcodes hexes instead of aliasing the --sp-* tokens
 *      shows up as white-on-white.
 *
 * WHAT "PRINT" MEANS HERE, EXACTLY
 * Browsers leave *Background graphics* off by default, so the paper a reader
 * actually gets has no background-colors on it at all — that is the whole reason
 * 44 of 46 pages once printed blank. Emulating print media does NOT emulate that:
 * Chrome still paints backgrounds. So the print pass composites against the bare
 * white sheet, honouring a background only where the page asks for it with
 * print-color-adjust: exact. SVG fills are content, not backgrounds, and do print,
 * so diagram shapes still count.
 *
 * The same numbers are also computed the other way — backgrounds painted, as if
 * the reader ticked the box — and reported as a separate warning tier. A page that
 * hardcodes a dark background instead of aliasing --sp-card is legible on default
 * paper and unreadable on ticked-box paper, and that distinction is worth keeping
 * visible rather than collapsing into one verdict.
 *
 * WHY IT NEEDS A BROWSER
 * Same reason as build-search-index.mjs: you cannot compute this from source. The
 * answer depends on the cascade, on inherited color, on alpha compositing through
 * an ancestor chain, on print media rules, and on SVG paint order. Only a real
 * layout knows.
 *
 * USAGE
 *   node tools/check-contrast.mjs                      # every *.html in the repo root
 *   node tools/check-contrast.mjs bone-song-zine.html  # just these
 *   node tools/check-contrast.mjs --check              # exit non-zero on any failure
 *
 * --check matches build-search-index.mjs's convention: it is the gating mode, the
 * one to put in the ship routine. A plain run always exits 0 so an informational
 * pass doesn't read as a crash — it still prints the failures, and says so.
 *
 * Requires: Google Chrome installed. Node 22+ (uses the global WebSocket).
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9412; // build-search-index.mjs holds 9411; different port so both can run
const CHECK = process.argv.includes('--check');

/* A fixed viewport, so a run is reproducible and so @media width rules resolve to
   the desktop layout every time. A narrow viewport is a different layout and could
   in principle carry different colors; if that ever matters, add a second pass
   here rather than eyeballing it. */
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

/* ─────────────────────────────────────────────────────────────────────────────
   Reveal everything that holds text before measuring.

   This is not cosmetic. A paged zine shows one .spread at a time (.spread.active;
   the rest are display:none), and field guides render their entries collapsed
   (.entry.open .entry-notes { display:block }). Measure the page as it first
   loads and you measure spread 1 of 12 — every other spread reports zero failures
   because it reported nothing at all. That is the same shape of bug as the
   search-index coverage gap: a page that checks 8% of itself looks exactly like a
   clean one.

   The print pass gets this for free (the shared sheet reveals every spread for
   paper) — it is the *screen* pass that would otherwise be nearly blind.

   Animations are killed rather than waited out: a fadeIn keyframe caught mid-flight
   reports opacity 0, which this tool skips as invisible, which would silently drop
   text from the count.

   This is a SCREEN-ONLY intervention, and it is undone before the print pass. The
   print stylesheet does its own revealing (.spread and .field-grid .entry-notes),
   and it reveals a *different* state: elements-field-guide.html gives .entry.open a
   hardcoded rgba(15,15,42,0.98), which no reader ever sees on paper because nothing
   adds .open when printing. Leaving the class on invented 257 print failures on
   that page alone. Measure the state that actually reaches the medium.
   ───────────────────────────────────────────────────────────────────────────── */
const REVEAL = String.raw`(() => {
  const st = document.createElement('style');
  st.id = 'ss-contrast-still';
  st.textContent = '*,*::before,*::after{animation:none !important;transition:none !important}';
  document.head.appendChild(st);
  /* Mark what we touch, so UNREVEAL puts back exactly this and nothing else. */
  let spreads = 0, entries = 0;
  for (const s of document.querySelectorAll('.spread:not(.active)')) {
    s.classList.add('active'); s.setAttribute('data-ss-revealed', 'active'); spreads++;
  }
  for (const e of document.querySelectorAll('.entry:not(.open)')) {
    e.classList.add('open'); e.setAttribute('data-ss-revealed', 'open'); entries++;
  }
  for (const d of document.querySelectorAll('details:not([open])')) {
    d.open = true; d.setAttribute('data-ss-revealed', 'details');
  }
  return JSON.stringify({ spreads, entries });
})()`;

const UNREVEAL = String.raw`(() => {
  let n = 0;
  for (const el of document.querySelectorAll('[data-ss-revealed]')) {
    const what = el.getAttribute('data-ss-revealed');
    if (what === 'details') el.open = false;
    else el.classList.remove(what);
    el.removeAttribute('data-ss-revealed');
    n++;
  }
  return JSON.stringify({ restored: n });
})()`;

/* ─────────────────────────────────────────────────────────────────────────────
   The measurement. A function of one argument so the same code serves all three
   backdrop models:

     'screen'   — backgrounds as painted.
     'paper'    — print media, backgrounds NOT painted (the browser default), so
                  every backdrop is the white sheet unless the page asked for it
                  with print-color-adjust: exact. This is the gating print number.
     'paper-bg' — print media with backgrounds painted, i.e. the reader ticked
                  "Background graphics". Reported as a warning, not a failure.
   ───────────────────────────────────────────────────────────────────────────── */
const MEASURE = String.raw`((mode) => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const paintBg = mode !== 'paper'; // 'paper' honours only print-color-adjust:exact

  /* ── WCAG 2.x relative luminance and contrast ratio ── */
  const chan = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* getComputedStyle hands back "rgb(1, 2, 3)" or "rgba(1, 2, 3, 0.5)"; the
     space/slash form "rgb(1 2 3 / 50%)" is accepted too, since it costs one
     character in the split and a silent parse failure here would read as a pass. */
  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter((x) => x.length).map((x) =>
      x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)
    );
    if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const show = (c) => 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')';

  /* ── Effective background: composite the whole ancestor stack ──
     Not "the token I think applies". A card at rgba(15,15,42,0.6) inside a panel
     inside the void is none of those three colors, and the difference is routinely
     the difference between 4.4:1 and 4.6:1.

     Element backgrounds only. The starfields are ::before pseudo-elements holding
     1px radial-gradient dots at partial alpha, which no getComputedStyle on a real
     element can see and which change nothing at that size. A *real* ancestor
     background-image (a photograph, a large gradient) is a different matter: the
     flat composite is then a guess, so it gets counted and reported instead of
     being quietly trusted. */
  const bgOf = (el) => {
    const stack = [];
    let image = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      /* On default paper a background exists only where the page insisted on it.
         print-color-adjust is an inherited property, so the computed value here
         already accounts for an ancestor having asked. */
      const exact = (cs.printColorAdjust || cs.webkitPrintColorAdjust) === 'exact';
      if (!paintBg && !exact) continue;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 1) break; // opaque: nothing above it can show through
      }
    }
    /* The canvas under everything is white — that is what a browser paints when no
       element supplies a background, and it is exactly the print case that made
       44 pages come out blank. */
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return { bg: base, image };
  };

  /* Multiplied element opacity from el up to (and including) stop, folded into the
     text's alpha before compositing.

     This is the difference between this tool and the throwaway versions that
     preceded it, and it is why they all reported zero: they read the colour and
     ignored opacity, so a watermark numeral at opacity 0.25 measured as if it were
     full strength. Opacity is what the reader sees, so it counts.

     Known bias: the model is exact when a faded ancestor has no background of its
     own (a wrapper at opacity 0.25 over an opaque card — the usual case), and
     slightly pessimistic when it does, because the ancestor's background fades with
     it and bgOf does not. Pessimistic is the safe direction: it can only make text
     look worse than it is, which gets a human to look. */
  const alphaOf = (el, stop) => {
    let a = 1;
    for (let n = el; n; n = n.parentElement) {
      const o = parseFloat(getComputedStyle(n).opacity);
      if (!Number.isNaN(o)) a *= o;
      if (n === stop) break;
    }
    return a;
  };

  const invisible = (el, cs) => {
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    if (parseFloat(cs.opacity) === 0) return true;
    const r = el.getBoundingClientRect();
    return !r.width || !r.height;
  };

  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  /* WCAG large-text exemption: 24px, or 18.66px at bold. */
  const needFor = (px, weight) => (px >= 24 || (weight >= 700 && px >= 18.66) ? 3.0 : 4.5);

  /* WCAG 1.4.3 exempts "text that is part of an inactive user interface component".
     starstuff.js disables the prev button on the first spread and next on the last,
     and .spread-nav-btn:disabled drops to opacity 0.25 — 1.86:1, and correctly so:
     the control is off. Exempt, but counted, so the exemption stays visible. */
  const inactive = (el) => !!el.closest(':disabled, [disabled], [aria-disabled="true"]');

  /* WCAG 1.4.3 also exempts text that is "pure decoration" — serving only an aesthetic
     purpose, conveying no information. Exactly one thing here qualifies: the ghosted
     numeral in the corner of a zine cover, which restates a number printed in full at
     normal contrast two lines below it in .cover-issue ("Zine No. 30"). It is a
     watermark, not a label, and raising it to 3:1 would need opacity 0.44–0.57 against
     the 0.15–0.26 it carries — a different cover, not a fixed one.

     Two deliberate constraints, because a decorative exemption is the easiest kind to
     abuse:
       · The selector list is explicit and short. There is no "anything aria-hidden"
         rule — that would let a future failure disappear by adding an attribute.
       · An element must ALSO be aria-hidden to qualify. Text a screen reader still
         announces is not decoration, so the claim has to be true in the markup before
         the tool will honour it.
     Counted apart from inactive controls and reported on its own line. */
  const DECORATIVE = '.cover-corner-num';
  const decorativeEl = (el) =>
    el.matches(DECORATIVE) && el.closest('[aria-hidden="true"]') !== null;

  const fails = [];
  const unmeasured = [];
  let checkedCss = 0, checkedSvg = 0, overImage = 0, exempt = 0, decorative = 0;

  const record = (kind, el, text, fg, bg, px, weight, note) => {
    const need = needFor(px, weight);
    const r = ratio(fg, bg);
    if (r >= need) return;
    fails.push({
      kind,
      tag: el.tagName.toLowerCase(),
      cls: String(el.getAttribute('class') || '').slice(0, 36),
      text: text.slice(0, 44),
      ratio: Math.round(r * 100) / 100,
      need,
      fg: show(fg),
      bg: show(bg),
      px: Math.round(px * 10) / 10,
      note: note || '',
    });
  };

  /* ── 1. HTML text ───────────────────────────────────────────────────────────
     SVG-namespace elements are deliberately excluded and handled below. An <svg>
     <text> does have its own text nodes and its own computed 'color', so a naive
     "everything with text" loop measures the inherited color the label does not
     use, reports a comfortable pass, and hides the fill that is actually painted.
     That is precisely how 226 failing labels stayed invisible. */
  for (const el of document.querySelectorAll('body *')) {
    if (el.namespaceURI === SVG_NS) continue;
    const text = ownText(el);
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (invisible(el, cs)) continue;
    if (inactive(el)) { exempt++; continue; }
    if (decorativeEl(el)) { decorative++; continue; }

    /* Gradient-clipped headings (.gradient-text, .hero-title em) paint their glyphs
       from a background image through -webkit-text-fill-color: transparent. There
       is no single text color to measure, and 'color' still holds a token that
       would report a cheerful pass. Say so instead. */
    const clip = cs.webkitBackgroundClip || cs.backgroundClip;
    const tfc = parse(cs.webkitTextFillColor);
    if (clip === 'text' || (tfc && tfc.a === 0)) {
      unmeasured.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 40), why: 'gradient-clipped text' });
      continue;
    }

    /* -webkit-text-fill-color wins over 'color' when both are set, so prefer it. */
    const raw = tfc || parse(cs.color);
    if (!raw) {
      unmeasured.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 40), why: 'unparseable color ' + cs.color });
      continue;
    }
    const { bg, image } = bgOf(el);
    if (image) overImage++;
    const px = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const a = raw.a * alphaOf(el, null);
    const fg = a < 1 ? over({ ...raw, a: Math.max(0, Math.min(1, a)) }, bg) : raw;
    checkedCss++;
    record('css', el, text, fg, bg, px, weight, image ? 'over background-image' : '');
  }

  /* ── 2. SVG text ────────────────────────────────────────────────────────────
     Two things make this different from the CSS pass, and both were near-misses in
     bf317cd:

     (a) The background is not the CSS ancestor stack. Labels are routinely written
         on a filled disc — dark ink on a bright accent, which is correct and is the
         pattern elements-field-guide.html got right first. A probe that only knew
         the page ground reported all 8 of that page's symbols at 1.05:1, and
         "fixing" them would have erased every element symbol on the page. So:
         composite the shapes actually painted behind the glyphs.

     (b) Only shapes EARLIER in document order count. SVG paints in document order,
         so a shape after the text is on top of it — a different bug, not a
         background.

     rect/circle/ellipse only. A <path> bounding box claims area the path never
     paints, so trusting it would invent backgrounds that aren't there and mask real
     failures. Under-claiming here is the safe direction: it can only make a label
     look worse than it is, which gets a human to look. */
  const insideEllipse = (r, x, y) => {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const rx = r.width / 2, ry = r.height / 2;
    if (!rx || !ry) return false;
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  };

  for (const svg of document.querySelectorAll('svg')) {
    const svgCs = getComputedStyle(svg);
    if (svgCs.display === 'none' || svgCs.visibility === 'hidden') continue;
    const svgRect = svg.getBoundingClientRect();
    if (!svgRect.width || !svgRect.height) continue;

    /* A viewBox scales user units to CSS pixels, and the large-text exemption is
       about the size the reader actually sees. font-size:14 in a 2× viewBox is 28px
       on screen and legitimately exempt; the same 14 in a shrunk diagram is not. */
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const scale = vb && vb.width ? svgRect.width / vb.width : 1;

    const shapes = [...svg.querySelectorAll('rect,circle,ellipse')];
    const base = bgOf(svg);

    for (const t of svg.querySelectorAll('text,tspan')) {
      const text = ownText(t);
      if (!text) continue;
      const cs = getComputedStyle(t);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const tr = t.getBoundingClientRect();
      if (!tr.width || !tr.height) continue;

      const raw = parse(cs.fill);
      if (!raw) {
        unmeasured.push({ tag: 'svg ' + t.tagName, text: text.slice(0, 40), why: 'fill ' + cs.fill });
        continue;
      }
      const fillA = raw.a * (Number.isNaN(parseFloat(cs.fillOpacity)) ? 1 : parseFloat(cs.fillOpacity)) * alphaOf(t, svg);
      if (fillA <= 0) continue; // invisible on purpose (measuring marks, hit targets)

      /* Composite what is painted behind the glyph's centre. */
      const x = tr.left + tr.width / 2, y = tr.top + tr.height / 2;
      let bg = base.bg;
      let guessed = false;
      for (const sh of shapes) {
        if (!(t.compareDocumentPosition(sh) & Node.DOCUMENT_POSITION_PRECEDING)) continue;
        const scs = getComputedStyle(sh);
        if (scs.display === 'none' || scs.visibility === 'hidden') continue;
        const r = sh.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const hit = sh.tagName === 'rect'
          ? x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
          : insideEllipse(r, x, y);
        if (!hit) continue;
        const f = parse(scs.fill);
        if (!f) {
          /* A gradient or pattern behind the text: no single colour to composite.
             Flag it rather than pretending the ground colour applies. */
          if (String(scs.fill).includes('url(')) guessed = true;
          continue;
        }
        const sa = f.a * (Number.isNaN(parseFloat(scs.fillOpacity)) ? 1 : parseFloat(scs.fillOpacity)) * alphaOf(sh, svg);
        if (sa <= 0) continue;
        bg = over({ ...f, a: Math.max(0, Math.min(1, sa)) }, bg);
      }
      if (guessed) {
        unmeasured.push({ tag: 'svg ' + t.tagName, text: text.slice(0, 40), why: 'gradient/pattern painted behind it' });
        continue;
      }
      if (base.image) overImage++;

      const px = parseFloat(cs.fontSize) * scale;
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const fg = fillA < 1 ? over({ ...raw, a: Math.max(0, Math.min(1, fillA)) }, bg) : raw;
      checkedSvg++;
      record('svg', t, text, fg, bg, px, weight, '');
    }
  }

  return JSON.stringify({ mode, fails, unmeasured, checkedCss, checkedSvg, overImage, exempt, decorative });
})`;

/* ─── minimal CDP client ──────────────────────────────────────────────────────
   Same shape as build-search-index.mjs, with one difference worth keeping in mind:
   send() here resolves with the WHOLE message, not m.result. So a Runtime.evaluate
   value sits at .result.result.value — the CDP result wrapping the JS result. Read
   .result.value and you get undefined, which JSON.parse turns into a confusing
   crash a long way from the cause. checkedValue() below does the unwrapping in one
   place so nobody has to remember. */
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

/* Unwrap Runtime.evaluate, and fail loudly. A JS exception inside the page comes
   back as exceptionDetails with no value at all; swallowing that would report a
   perfect zero-failure page for a page we never measured. */
function evaluated(msg, what) {
  const r = msg && msg.result;
  if (!r || r.exceptionDetails) {
    throw new Error(
      `${what} threw in-page: ${JSON.stringify(r && r.exceptionDetails).slice(0, 600)}`
    );
  }
  if (!r.result || r.result.value === undefined) {
    throw new Error(`${what} returned no value: ${JSON.stringify(msg).slice(0, 600)}`);
  }
  return JSON.parse(r.result.value);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait on a CONDITION, never on a clock.
 *
 * This was `await sleep(1300)` with the comment "let the client-rendered field
 * guides paint", which is a guess dressed as a wait. `build-search-index.mjs`,
 * two files away, already lost exactly this race **on local files**: one build
 * emitted 629 records where the builds either side gave 637 — eight records gone,
 * exit code 0, no warning. Whatever protects that script protects this one.
 *
 * Measured before changing it: three runs over the three heaviest client-rendered
 * field guides returned identical counts every time, so the sleep was not
 * currently losing. This is insurance against the day a page gets heavier, not a
 * fix for a live fault.
 *
 * Returns the settled text length, 0 for a genuinely empty document, or null if
 * it never settled. It does NOT throw: this tool sweeps 79 pages, and aborting at
 * page 30 to report one bad page would throw away the other 49 results.
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
  if (!args.length) {
    return fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
  }
  return args.map((a) => {
    const rel = path.relative(ROOT, path.resolve(a));
    const inRoot = path.join(ROOT, path.basename(a));
    if (fs.existsSync(path.resolve(a))) return rel;
    if (fs.existsSync(inRoot)) return path.basename(a);
    console.error(`No such file: ${a}`);
    process.exit(1);
  });
}

function detail(f) {
  const cls = f.cls ? '.' + f.cls.split(/\s+/).join('.') : '';
  return `      ${String(f.ratio).padStart(5)}:1 (need ${f.need}) ${f.kind} <${f.tag}${cls}> ` +
    `${f.px}px ${f.fg} on ${f.bg}${f.note ? ' [' + f.note + ']' : ''}\n        "${f.text}"`;
}

async function main() {
  const files = resolveTargets();

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-contrast-'), 'profile')}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/json/version`);
      break;
    } catch {
      await sleep(250);
    }
  }

  const results = [];
  /* Pages that were not validly measured — a page that never settled, or one that
     settled with zero text elements. Kept apart from `results` on purpose: these
     are not contrast findings, they are the absence of a measurement, and this
     repo's baseline is ~100 known failures, so a zero-measure page folded into
     that total would move it DOWN and read as an improvement. */
  const unread = [];
  try {
    for (const f of files) {
      const out = await withPage(`file://${path.join(ROOT, f)}`, async (send) => {
        await send('Page.enable');
        await send('Emulation.setDeviceMetricsOverride', {
          width: VIEWPORT.width,
          height: VIEWPORT.height,
          deviceScaleFactor: 1,
          mobile: false,
        });
        const settledChars = await settle(send);

        /* Screen: reveal the spreads and entries first, or spread 1 of 12 is the
           whole measurement. */
        evaluated(await send('Runtime.evaluate', { expression: REVEAL, returnByValue: true }), 'reveal');
        await sleep(200);
        const screen = evaluated(
          await send('Runtime.evaluate', { expression: `${MEASURE}('screen')`, returnByValue: true }),
          'screen measure'
        );

        /* Print: hand the page back its own state, then let the print stylesheet
           reveal what it reveals. */
        evaluated(await send('Runtime.evaluate', { expression: UNREVEAL, returnByValue: true }), 'unreveal');
        await send('Emulation.setEmulatedMedia', { media: 'print' });
        await sleep(400);
        const print = evaluated(
          await send('Runtime.evaluate', { expression: `${MEASURE}('paper')`, returnByValue: true }),
          'print measure'
        );
        const printBg = evaluated(
          await send('Runtime.evaluate', { expression: `${MEASURE}('paper-bg')`, returnByValue: true }),
          'print+backgrounds measure'
        );
        await send('Emulation.setEmulatedMedia', { media: '' });
        return { screen, print, printBg, settledChars };
      });

      results.push([f, out]);

      /* The silent-pass class this whole tool exists to prevent, applied to
         itself: zero failures out of zero elements is not a clean page, it is a
         page nobody looked at, and in a 79-line list it looks like every other
         passing line. */
      const measuredHere = out.screen.checkedCss + out.screen.checkedSvg;
      let notMeasured = true;
      if (out.settledChars === null) {
        unread.push([f, 'never settled — readyState/text length still changing after 15s']);
      } else if (measuredHere === 0) {
        unread.push([f, out.settledChars === 0
          ? 'loaded with no text at all'
          : 'measured 0 text elements despite having text — check the reveal step']);
      } else {
        notMeasured = false;
      }

      /* Print a line for every page, pass or fail. The search-index script learned
         this the hard way: when the only output is "it worked", a page indexing 12%
         of itself is indistinguishable from a healthy one. Counts of what was
         actually measured are the part that makes a silent regression visible. */
      const s = out.screen, p = out.print, pb = out.printBg;
      const bad = s.fails.length + p.fails.length;
      const un = s.unmeasured.length + p.unmeasured.length;
      process.stdout.write(
        `  ${f.padEnd(42)} ${notMeasured ? 'UNREAD' : bad ? 'FAIL  ' : 'ok    '}` +
          `  screen ${String(s.fails.length).padStart(3)}/${String(s.checkedCss + s.checkedSvg).padEnd(4)}` +
          `  print ${String(p.fails.length).padStart(3)}/${String(p.checkedCss + p.checkedSvg).padEnd(4)}` +
          `  svg ${String(s.checkedSvg).padStart(3)}` +
          (pb.fails.length ? `  +bg ${pb.fails.length}` : '') +
          (un ? `  ~${un} unmeasured` : '') +
          '\n'
      );
      for (const [label, res] of [['screen', s], ['print', p]]) {
        if (!res.fails.length) continue;
        console.log(`    ${label}:`);
        for (const x of res.fails.slice(0, 8)) console.log(detail(x));
        if (res.fails.length > 8) console.log(`      … ${res.fails.length - 8} more`);
      }
    }
  } finally {
    chrome.kill();
  }

  const tot = (k, m) => results.reduce((a, [, o]) => a + o[m][k].length, 0);
  const sum = (k, m) => results.reduce((a, [, o]) => a + o[m][k], 0);
  const screenFails = tot('fails', 'screen');
  const printFails = tot('fails', 'print');
  const checked = sum('checkedCss', 'screen') + sum('checkedSvg', 'screen') +
    sum('checkedCss', 'print') + sum('checkedSvg', 'print');
  const svgChecked = sum('checkedSvg', 'screen') + sum('checkedSvg', 'print');
  const unmeasured = tot('unmeasured', 'screen') + tot('unmeasured', 'print');
  const overImage = sum('overImage', 'screen') + sum('overImage', 'print');
  const exempt = sum('exempt', 'screen') + sum('exempt', 'print');
  const decorative = sum('decorative', 'screen') + sum('decorative', 'print');
  const bgWarn = results.filter(([, o]) => o.printBg.fails.length);

  console.log(
    `\n${results.length} pages · ${checked.toLocaleString()} text elements measured ` +
      `(${svgChecked.toLocaleString()} SVG labels) · ` +
      `${screenFails} screen failure(s), ${printFails} print failure(s)`
  );
  if (exempt) {
    console.log(
      `${exempt} inactive-control element(s) exempt under WCAG 1.4.3 (disabled prev/next buttons).`
    );
  }
  /* Its own line, never folded into the one above. Two exemptions summed together
     read as one small allowance; kept apart, a number that grows is a number that
     can be questioned. */
  if (decorative) {
    console.log(
      `${decorative} decorative element(s) exempt under WCAG 1.4.3 (aria-hidden cover ` +
        `watermark numerals — the issue number is stated at full contrast in .cover-issue).`
    );
  }

  /* The ticked-box tier. Not a failure — default paper never paints these — but a
     page landing here is hardcoding a dark background where it could alias
     --sp-card, and it is unreadable for any reader who prints with Background
     graphics on. */
  if (bgWarn.length) {
    const n = bgWarn.reduce((a, [, o]) => a + o.printBg.fails.length, 0);
    console.log(
      `\n${n} element(s) on ${bgWarn.length} page(s) would be unreadable if the reader prints WITH\n` +
        `"Background graphics" on — a dark background that survives print because it is a literal\n` +
        `hex rather than an aliased --sp-* token. Default paper is unaffected.`
    );
    for (const [f, o] of bgWarn.sort((a, b) => b[1].printBg.fails.length - a[1].printBg.fails.length).slice(0, 10)) {
      const x = o.printBg.fails[0];
      console.log(`  ${String(o.printBg.fails.length).padStart(4)}×  ${f.padEnd(42)} e.g. ${x.fg} on ${x.bg}`);
    }
  }

  /* Anything the method cannot measure is stated, never dropped. A gradient-clipped
     heading or a label on a gradient has no single pair of colours to compare, and
     a skipped element that goes unmentioned reads as a passing one. */
  if (unmeasured) {
    const seen = new Map();
    for (const [f, o] of results)
      for (const u of [...o.screen.unmeasured, ...o.print.unmeasured]) {
        const k = `${f} · ${u.why}`;
        seen.set(k, (seen.get(k) || 0) + 1);
      }
    console.log(`\n${unmeasured} element(s) could not be measured — check these by eye:`);
    for (const [k, n] of [...seen].sort((a, b) => b[1] - a[1]).slice(0, 20))
      console.log(`  ${String(n).padStart(3)}×  ${k}`);
  }
  if (overImage) {
    console.log(
      `\n${overImage} element(s) sit over an ancestor background-image; their background is the ` +
        `flat composite, which is an approximation. (Starfield ::before dots are not counted.)`
    );
  }

  /* Reported in its own block, above the summary, never mixed into the failure
     count. An unmeasured page is a broken RUN, not a bad page. */
  if (unread.length) {
    console.error(
      `\n${unread.length} page(s) WERE NOT MEASURED. Nothing below counts for these:`
    );
    for (const [f, why] of unread) console.error(`  ${f.padEnd(42)} ${why}`);
    console.error(
      'A page that measures nothing reports zero failures, which is indistinguishable\n' +
        'from a clean page in every other line of this output.'
    );
  }

  const failures = screenFails + printFails;
  if (CHECK) {
    if (unread.length) {
      console.error(`\nFAIL — ${unread.length} page(s) not measured; the run is incomplete.`);
      process.exit(1);
    }
    if (failures) {
      console.error(`\nFAIL — ${failures} element(s) under WCAG AA (4.5:1, or 3.0:1 for large text).`);
      process.exit(1);
    }
    console.log('\nPASS — every measured text element clears WCAG AA on screen and in print.');
    process.exit(0);
  }
  if (failures) {
    console.log(`\n${failures} failure(s). Run with --check to make this gate a ship.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
