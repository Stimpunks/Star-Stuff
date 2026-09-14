#!/usr/bin/env node
/* check-edit-ui.mjs — measure edit.js, which no other tool on this site can see.
 *
 * NOT A GATE, DELIBERATELY, and the reason is the one check-dead-css.mjs gives: every
 * one of the nine gates answers a question about a defect a READER meets, and no reader
 * ever meets this file. Nothing on any page loads it; it arrives from a bookmark. So
 * check-contrast, check-overlap, check-classes and check-forced-colors all measure pages
 * the editor is absent from, and each is right to. This is the on-demand audit that
 * covers the gap, in the same family as check-embeds.mjs.
 *
 * IT IS THE "INVISIBLE TO THE GATE BY CONSTRUCTION" CASE. starstuff.css's own record of
 * the 2026-08-31 print fix says it plainly: when a change cannot be seen by the gate,
 * run the gate for regressions and something else for confirmation. This is the
 * something else.
 *
 * What it measures, on each archetype page, with the editor injected exactly the way
 * the bookmarklet injects it:
 *
 *   1. CONTRAST of every text element the editor draws, composited against its real
 *      ancestor background stack. The gating ground on this site is --sp-card (#0f0f2a),
 *      the LIGHTEST thing text sits on, which on a dark site is the worst case and the
 *      inverse of where a daylight site's floor sits. Both grounds are reported.
 *   2. HIT TARGETS. Every control 44x44 minimum, and no two overlapping.
 *   3. ARMED AND REFUSED COUNTS per page. A page that arms zero blocks is reported as
 *      UNARMED and kept apart from the failure total, because zero failures out of zero
 *      measured elements is the UNREAD fault check-contrast.mjs records — it looks
 *      exactly like a clean page.
 *   4. THE REFUSALS ACTUALLY FIRING. A refusal list nobody exercises is a comment.
 *   5. THE ENTITY ROUND TRIP, proved in both directions on real pages.
 *
 *   node tools/check-edit-ui.mjs
 *   node tools/check-edit-ui.mjs --check     # exit non-zero on any finding
 *   node tools/check-edit-ui.mjs --verbose
 *
 * Chrome and Node 22+. Local dev tool; Netlify does not run it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CDP_PORT = 9438;   /* contrast holds 9412, the index 9411, classes its own */
const HTTP_PORT = 8788;
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');

/* One page per shape the editor has to survive. A sample, not a sweep — the editor is
   one file and its UI is identical everywhere; what varies is the page under it. */
const PAGES = [
  ['index.html', 'the front page: cards, masthead, no .ss-nav'],
  ['design.html', 'a prose doc page, and where the bookmark is published'],
  ['privacy.html', 'a prose doc page with a ledger table'],
  ['bone-song-zine.html', 'a paged zine: hidden spreads, pull-quotes, a colophon'],
  ['build-the-eclipse-zine.html', 'a chain zine: documented / contested / leap joints'],
  ['proportioned-to-the-groove-zine.html', 'a scroll zine'],
  ['elements-field-guide.html', 'a field guide: entries built from JS object literals'],
  ['collection-star-stuff.html', 'a collection page: cards and a hero-count'],
  ['trigger-overshoot.html', 'a Trigger: readiness grades'],
  ['glimmer-wire-2026-09-04.html', 'a Wire edition: verification grades'],
];
/* Must refuse to open at all. */
const GENERATED_PAGES = ['whats-new.html'];

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No Chrome/Chromium found.'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the server ────────────────────────────────────────────────────────────────
   Served over HTTP rather than file://, and with THE REAL PRODUCTION CSP, because
   the whole distribution question turns on it: a harness that omits the policy would
   happily report that an injected script runs when on the live site it does not.
   The policy comes from build-csp.mjs --print, which writes the policy and nothing
   else to stdout — the inventory goes to stderr. A newline in it would make the
   header invalid and take the server down, which is a failure that reads as nine
   failures on the site, so it is asserted rather than trusted. */
const POLICY = execFileSync('node', [path.join(ROOT, 'tools/build-csp.mjs'), '--print'],
  { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
if (!POLICY.startsWith('default-src') || /[\r\n]/.test(POLICY)) {
  console.error('build-csp.mjs --print did not return a single-line policy.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  try {
    const buf = fs.readFileSync(path.join(ROOT, rel));
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(rel)] || 'application/octet-stream',
      'Content-Security-Policy': POLICY,
    });
    res.end(buf);
  } catch { res.writeHead(404, { 'Content-Security-Policy': POLICY }); res.end('404'); }
});
await new Promise((r) => server.listen(HTTP_PORT, '127.0.0.1', r));

/* ── CDP ───────────────────────────────────────────────────────────────────── */
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${fs.mkdtempSync('/tmp/ss-edit-ui-')}/p`, 'about:blank'], { stdio: 'ignore' });
let ver = null;
for (let i = 0; i < 80; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json(); break; }
  catch { await sleep(200); }
}
if (!ver) { console.error('Chrome never came up.'); process.exit(1); }

const sock = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => sock.addEventListener('open', r));
let msgId = 0; const pending = new Map(); let logs = [];
sock.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method === 'Log.entryAdded') logs.push(msg.params.entry.text || '');
});
const raw = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++msgId;
  pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  sock.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetId } = await raw('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await raw('Target.attachToTarget', { targetId, flatten: true });
const send = (m, p) => raw(m, p, sessionId);
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

const evaluate = async (expression) => (await send('Runtime.evaluate',
  { expression, returnByValue: true, awaitPromise: true })).result.value;

async function load(url) {
  logs = [];
  await send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await sleep(150);
  }
  /* Same condition the search index and the contrast checker use: text length steady
     across two samples. The field guides paint their entries from JS after load, and
     a clock is a race — build-search-index.mjs lost exactly that race once, at
     exit code 0 with no warning. */
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const n = await evaluate('document.body.textContent.length');
    if (n === last) break;
    last = n; await sleep(150);
  }
  /* Animations off: a fadeIn caught mid-flight reports opacity 0, which reads as
     invisible, which silently drops an element from the measurement. */
  await evaluate(`(function(){var s=document.createElement('style');
    s.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);})()`);
}

/* Inject the editor exactly as the bookmarklet does: a <script src> element, same
   origin, under the live policy. If script-src ever stops permitting this, the
   injection fails here rather than on somebody's machine. */
async function inject() {
  await evaluate(`(function(){var s=document.createElement('script');
    s.src=location.origin+'/edit.js';document.body.appendChild(s);})()`);
  for (let i = 0; i < 40; i++) {
    if (await evaluate('!!window.__ssEdit')) return true;
    await sleep(100);
  }
  return false;
}

/* ── contrast, composited against the real ancestor stack ──────────────────── */
const PROBE = `(function () {
  function parse(c) {
    var m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null;
    var p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg) {
    var a = fg.a + bg.a * (1 - fg.a);
    if (!a) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: (fg.r*fg.a + bg.r*bg.a*(1-fg.a))/a,
             g: (fg.g*fg.a + bg.g*bg.a*(1-fg.a))/a,
             b: (fg.b*fg.a + bg.b*bg.a*(1-fg.a))/a, a: a };
  }
  function lum(c) {
    var f = [c.r, c.g, c.b].map(function (v) {
      v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2];
  }
  function ratio(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }
  function groundOf(el) {
    var stack = { r: 10, g: 10, b: 20, a: 1 }, chain = [], n = el;
    while (n && n.nodeType === 1) { chain.push(n); n = n.parentElement; }
    for (var i = chain.length - 1; i >= 0; i--) {
      var bg = parse(getComputedStyle(chain[i]).backgroundColor);
      if (bg && bg.a > 0) stack = over(bg, stack);
    }
    return stack;
  }

  var ui = Array.prototype.slice.call(document.querySelectorAll(
    '.ss-edit-bar, .ss-edit-bar *, .ss-edit-why, .ss-edit-out'));
  var texts = [], targets = [];
  ui.forEach(function (el) {
    var cs = getComputedStyle(el);
    var own = Array.prototype.filter.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim().length > 0;
    }).map(function (n) { return n.textContent.trim(); }).join(' ');
    var r = el.getBoundingClientRect();
    if (own) {
      var px = parseFloat(cs.fontSize);
      var bold = parseInt(cs.fontWeight, 10) >= 700;
      var large = px >= 24 || (bold && px >= 18.66);
      var fg = parse(cs.color);
      var ground = groundOf(el.parentElement || el);
      var eff = over(fg, ground);
      texts.push({
        sel: el.className || el.tagName.toLowerCase(),
        tag: el.tagName.toLowerCase(),
        text: own.slice(0, 60),
        px: Math.round(px * 10) / 10,
        fg: cs.color, bg: 'rgb(' + [ground.r, ground.g, ground.b].map(Math.round).join(',') + ')',
        ratio: Math.round(ratio(eff, ground) * 100) / 100,
        need: large ? 3 : 4.5,
        disabled: !!el.disabled,
      });
    }
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'TEXTAREA') {
      targets.push({ sel: (el.id || el.className || el.tagName.toLowerCase()),
        w: Math.round(r.width), h: Math.round(r.height),
        x: Math.round(r.left), y: Math.round(r.top) });
    }
  });
  return JSON.stringify({ texts: texts, targets: targets });
})()`;

/* ── run ───────────────────────────────────────────────────────────────────── */
const base = `http://127.0.0.1:${HTTP_PORT}`;
const findings = [];
const unarmed = [];
const rows = [];
/* Which refusal rules actually fire. A rule that never fires anywhere is a comment,
   not a control — same reason every exemption list in this directory prints its size. */
const ruleHits = {};
let ruleCount = 0;

for (const [page, what] of PAGES) {
  await load(`${base}/${page}`);
  const ok = await inject();
  if (!ok) {
    findings.push(`${page}: edit.js DID NOT RUN under the live CSP — ` +
      (logs.find((l) => /Content Security Policy/i.test(l)) || 'no violation logged'));
    rows.push({ page, what, armed: 0, refused: 0, texts: 0, worst: null, fails: 1 });
    continue;
  }
  const stats = await evaluate('JSON.stringify(window.__ssEdit.stats())').then(JSON.parse);
  for (const [k, n] of Object.entries(stats.firedBy || {})) ruleHits[k] = (ruleHits[k] || 0) + n;
  ruleCount = stats.rules;
  const probe = JSON.parse(await evaluate(PROBE));

  /* Force the toast AND the textarea fallback open, because both are surfaces a
     contributor reads and neither exists until something happens — the toast after
     a refused click, the textarea only when the clipboard write fails. An unmeasured
     surface is not a passing surface. */
  await evaluate(`(function(){var r=document.querySelector('[data-ss-refused]');
    if(r) r.click(); })()`);
  await evaluate(`(function(){
    var t=document.createElement('textarea');
    t.className='ss-edit-out ss-edit-ui'; t.value='measured';
    document.querySelector('.ss-edit-bar').appendChild(t); })()`);
  await sleep(200);
  /* A refused block inside a card is inside a link. If the click navigated, every
     number taken after it describes a different page — so the URL is checked rather
     than the probe trusted, which is how the missing preventDefault was found. */
  const stillHere = await evaluate('location.pathname');
  if (stillHere !== '/' + page && !(page === 'index.html' && stillHere === '/')) {
    findings.push(`${page}: pressing a refused block NAVIGATED to ${stillHere} instead of`
      + ' explaining the refusal — the contributor never sees why it is refused.');
    fails++;
    await load(`${base}/${page}`); await inject();
  }
  const probe2 = JSON.parse(await evaluate(PROBE));
  const texts = probe2.texts.length > probe.texts.length ? probe2.texts : probe.texts;
  const targets = probe2.targets.length ? probe2.targets : probe.targets;

  let fails = 0;
  for (const t of texts) {
    /* No exemption for the disabled buttons. WCAG 1.4.3 would allow one — an inactive
       UI component — and check-contrast.mjs takes it for the disabled pager. This
       does not, because there was no need to: --sp-dim-soft was raised in 2026-08 to
       clear 4.5:1 on the lightest ground precisely so small dim text would not need
       an exemption, and an allowance taken where it is not needed is an allowance
       somebody later cites where it is. */
    if (t.ratio < t.need) {
      fails++;
      findings.push(`${page}: ${t.ratio}:1 (needs ${t.need}:1) — ${t.px}px ${t.fg} on ${t.bg}`
        + ` · .${t.sel} "${t.text}"`);
    }
  }
  for (const g of targets) {
    if (g.w < 44 || g.h < 44) {
      fails++;
      findings.push(`${page}: hit target ${g.w}x${g.h} under 44x44 — ${g.sel}`);
    }
  }
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i], b = targets[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 0 && oy > 0) {
        fails++;
        findings.push(`${page}: hit targets overlap by ${ox}x${oy}px — ${a.sel} / ${b.sel}`);
      }
    }
  }

  /* A page that armed nothing is not a passing page. Kept out of the failure total
     on purpose: folding it in would move the number DOWN and read as an improvement,
     which is the UNREAD fault check-contrast.mjs exists to avoid. */
  if (stats.armed === 0) unarmed.push(`${page} — armed 0 blocks (${what})`);

  /* A page where no control was found is not a page whose controls all pass. Zero
     overlaps out of zero targets reads exactly like a clean measurement, which is the
     UNREAD fault again — so the count is carried into the table rather than inferred
     from the silence. */
  if (!targets.length) {
    findings.push(`${page}: measured 0 hit targets — the probe found no controls, so the`
      + ' 44x44 and overlap results on this page mean nothing.');
    fails++;
  }
  const worst = texts.length ? texts.reduce((a, b) => (a.ratio < b.ratio ? a : b)) : null;
  rows.push({ page, what, armed: stats.armed, refused: stats.refused,
    texts: texts.length, targets: targets.length, worst: worst ? worst.ratio : null, fails });
}

/* ── the generated pages must refuse to open ───────────────────────────────── */
const generated = [];
for (const page of GENERATED_PAGES) {
  await load(`${base}/${page}`);
  await evaluate(`window.__ssAlert=null;window.alert=function(m){window.__ssAlert=m;};`);
  await inject();
  await sleep(400);
  const alerted = await evaluate('window.__ssAlert');
  const armedAnyway = await evaluate('!!window.__ssEdit');
  if (!alerted || armedAnyway) {
    findings.push(`${page}: a generated page was NOT refused (alert=${JSON.stringify(alerted)},`
      + ` editor armed=${armedAnyway}) — a hand edit here reverts silently on the next build.`);
  }
  generated.push(`${page} — ${alerted ? 'refused' : 'NOT REFUSED'}`);
}

/* ── the entity round trip, proved in both directions ──────────────────────── */
await load(`${base}/design.html`);
await inject();
const entity = JSON.parse(await evaluate(`(function(){
  var raw = 0, enc = 0, sample = null;
  var blocks = document.querySelectorAll('main p');
  for (var i = 0; i < blocks.length; i++) {
    var h = blocks[i].innerHTML;
    if (/\\u2014/.test(h)) { raw++; if (!sample) sample = h.slice(0, 90); }
    if (/&mdash;/.test(h)) enc++;
  }
  return JSON.stringify({ decodedEmDash: raw, encodedEmDash: enc, sample: sample });
})()`));
const fileSrc = fs.readFileSync(path.join(ROOT, 'design.html'), 'utf8');
const fileRaw = (fileSrc.match(/—/g) || []).length;
const fileEnc = (fileSrc.match(/&mdash;/g) || []).length;

/* ── report ────────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s).padEnd(n);
console.log('\n  edit.js — the audit no gate can run\n');
console.log('  ' + pad('page', 38) + pad('armed', 8) + pad('refused', 9)
  + pad('UI text', 9) + pad('targets', 9) + 'worst');
console.log('  ' + '-'.repeat(82));
for (const r of rows) {
  console.log('  ' + pad(r.page, 38) + pad(r.armed, 8) + pad(r.refused, 9)
    + pad(r.texts, 9) + pad(r.targets, 9) + (r.worst === null ? '—' : r.worst + ':1')
    + (r.fails ? `   ${r.fails} FAIL` : ''));
}
console.log('\n  generated pages: ' + generated.join(', '));

const silent = [];
for (let i = 0; i < ruleCount; i++) if (!ruleHits[i]) silent.push(i);
console.log('\n  refusal rules that fired across the sample: '
  + Object.keys(ruleHits).filter((k) => k !== 'trailer').length + ' of ' + ruleCount
  + '  ·  blocks refused: ' + Object.values(ruleHits).reduce((a, b) => a + b, 0));
console.log('    per rule: ' + Array.from({ length: ruleCount }, (_, i) => `${i}:${ruleHits[i] || 0}`).join('  ')
  + `  trailer:${ruleHits.trailer || 0}`);
if (silent.length) {
  console.log('    RULES ' + silent.join(', ') + ' fired nowhere in this sample — either the'
    + ' sample misses their page shape, or the selector does not match what it names.');
}

console.log('\n  THE ENTITY ROUND TRIP, both directions, on design.html:');
console.log(`    the FILE holds  ${fileRaw} raw em dashes and ${fileEnc} as &mdash;`);
console.log(`    the DOM reports ${entity.decodedEmDash} blocks with a decoded em dash `
  + `and ${entity.encodedEmDash} with a literal "&mdash;"`);
console.log(entity.encodedEmDash === 0
  ? '    -> innerHTML DECODED every one of them, so an exact byte-for-byte BEFORE is not'
    + '\n       available from a browser at all. The patch says decoded, and says so.'
  : '    -> UNEXPECTED: a literal &mdash; survived into innerHTML. Re-read the export note.');
if (fileRaw > 0 && fileEnc > 0) {
  console.log(`    -> and this one file is itself mixed (${fileRaw} raw, ${fileEnc} encoded), so no`
    + '\n       re-encoding on the way out could reproduce it either.');
}
if (entity.sample) console.log(`    sample: ${entity.sample.replace(/\s+/g, ' ')}`);

if (unarmed.length) {
  console.log('\n  UNARMED — armed no blocks, which is not the same as passing:');
  for (const u of unarmed) console.log('    ' + u);
}
if (findings.length) {
  console.log(`\n  ${findings.length} finding${findings.length === 1 ? '' : 's'}:`);
  for (const f of (VERBOSE ? findings : findings.slice(0, 12))) console.log('    ' + f);
  if (!VERBOSE && findings.length > 12) console.log(`    … ${findings.length - 12} more (--verbose)`);
} else {
  console.log('\n  0 findings — contrast, hit targets, refusals and the CSP injection all clear.');
}
console.log('');

sock.close(); chrome.kill(); server.close();
process.exit(CHECK && (findings.length || unarmed.length) ? 1 : 0);
