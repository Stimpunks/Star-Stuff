#!/usr/bin/env node
/**
 * build-search-index.mjs — regenerates search-index.json for starstuff.earth
 *
 * WHY THIS IS A SCRIPT AND NOT A BUILD STEP
 * Netlify serves this repo as-is, with no build. This script is a *local dev
 * tool*: you run it by hand when content changes, and commit the JSON it writes,
 * exactly the way sitemap.xml and changelog.html are maintained. Nothing on the
 * server runs it.
 *
 * WHY IT NEEDS A BROWSER
 * You cannot index this site from its HTML source. The seven field guides hold
 * their entries in JS object literals and render them client-side, and a lot of
 * zine text sits in spreads that are display:none until you page to them. So we
 * load each page in headless Chrome, let it render, then read textContent (not
 * innerText — innerText skips anything not currently laid out, which on the
 * constellation guide alone loses ~89% of the words).
 *
 * Because we read textContent, we must first strip <script> and <style> from the
 * clone we read, or the field guides' own source code lands in the index.
 *
 * USAGE
 *   node tools/build-search-index.mjs            # writes ../search-index.json
 *   node tools/build-search-index.mjs --check    # verify freshness, write nothing
 *
 * Requires: Google Chrome installed. Node 22+ (uses the global WebSocket).
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'search-index.json');
const PORT = 9411;
const CHECK = process.argv.includes('--check');

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

/* Pages that are tooling or duplicates rather than readable artifacts. */
const SKIP = new Set(['search.html']);

/* ─────────────────────────────────────────────────────────────────────────────
   The in-page extractor. Runs inside each page after render.
   Returns { title, records: [{ frag, heading, text }] }.
   ───────────────────────────────────────────────────────────────────────────── */
const EXTRACT = String.raw`(() => {
  const squash = (s) => (s || '').replace(/\s+/g, ' ').trim();

  /* Chrome that repeats on every page would otherwise be indexed 400+ times and
     match every query. Also drop script/style: we read textContent, so their
     source would come through as words. */
  const CHROME_SEL = [
    'script', 'style', 'noscript', 'template',
    '.ss-nav', '.nav', '.spread-footer-nav', '.spread-nav-btn',
    '.twinkle', '.sp-twinkle', '.controls', '.print-hint',
  ].join(',');

  /* Blocks that sit flush against each other in the source concatenate under
     textContent with nothing between them — "…not a taker." + "There's a deeper
     rhyme" becomes "a taker.There's a deeper rhyme", which then reads as one
     mangled word in a snippet and breaks whole-word matching across the join.
     Append an explicit space to every block-ish node before reading. */
  /* .attr / .attribution are spans the house style renders as their own line
     under a pull-quote, so they need the same treatment as a real block. */
  const BLOCK_SEL =
    'p,div,li,tr,td,th,h1,h2,h3,h4,h5,h6,br,hr,blockquote,section,article,' +
    'figcaption,dt,dd,pre,.attr,.attribution';

  const textOf = (el) => {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll(CHROME_SEL).forEach((n) => n.remove());
    /* Pad both sides: appending alone fixes "</p><p>" joins but not inline text
       running straight into a following block ("…always do." + <span class="attr">
       "Ira Socol"), where the appended space lands after the name instead of
       before it. squash() collapses the resulting double spaces. */
    clone.querySelectorAll(BLOCK_SEL).forEach((n) => {
      n.parentNode && n.parentNode.insertBefore(document.createTextNode(' '), n);
      n.appendChild(document.createTextNode(' '));
    });
    return squash(clone.textContent);
  };

  /* Headings go through textOf too, not raw textContent: cover titles are
     routinely broken with <br>, so "Where it meets<br>the ground" would become
     the result title "Where it meetsthe ground". */
  const headingOf = (el) =>
    textOf(
      el.querySelector(
        'h1,h2,h3,.spread-heading,.cover-title,.section-heading,.entry-name,.release-title,.card-title'
      )
    );

  const records = [];
  const push = (frag, heading, text) => {
    if (text && text.length >= 40) records.push({ frag, heading, text });
  };

  /* 1. Paged zines: one record per spread, so a hit deep-links via #spread-N,
        which starstuff.js already resolves and reveals. */
  const spreads = [...document.querySelectorAll('[id^="spread-"]')];
  if (spreads.length) {
    for (const sp of spreads) push('#' + sp.id, headingOf(sp), textOf(sp));
    return JSON.stringify({ title: document.title, records });
  }

  /* 2. Field guides: one record per entry, keyed to the entry's own id so the
        page can open it. These are the JS-rendered, often-collapsed ones. */
  const entries = [...document.querySelectorAll('.entry[id], article.entry, .fg-entry[id]')];
  if (entries.length >= 3) {
    for (const e of entries) {
      const name = textOf(e.querySelector('.entry-name, .entry-title, h2, h3'));
      push(e.id ? '#' + e.id : '', name, textOf(e));
    }
    if (records.length) return JSON.stringify({ title: document.title, records });
  }

  /* 3. Everything else: chunk on sections/cards/rows so a hit lands mid-page
        rather than at the top. */
  const main =
    document.querySelector('main, .doc-shell, .wrap, .stimpunks-manifesto, .sp-wrap') ||
    document.body;
  const chunks = [
    ...main.querySelectorAll('section, article, .card, .entry, .sp-section, .scale, .lp-row'),
  ];
  const seen = new Set();
  for (const c of chunks) {
    /* Skip a chunk whose text is already covered by an ancestor chunk. */
    if (chunks.some((o) => o !== c && o.contains(c))) continue;
    const t = textOf(c);
    if (seen.has(t)) continue;
    seen.add(t);
    push(c.id ? '#' + c.id : '', headingOf(c), t);
  }

  /* 3b. Pages built as a flat run of headings and paragraphs — no sections at
         all — would otherwise become one enormous record, so a match anywhere
         would dump the reader at the top of a 40,000-character page. Walk the
         heading run instead and cut a record at each one. Where the heading has
         no id to link to, fall back to a text fragment (#:~:text=), which
         scrolls and highlights in Chrome, Edge and Safari and degrades to
         "top of page" everywhere else. */
  const HEAD = 'h1,h2,h3';
  if (records.length < 3) {
    const heads = [...main.querySelectorAll(HEAD)].filter((h) => textOf(h));
    if (heads.length >= 3) {
      records.length = 0;
      heads.forEach((h, i) => {
        const stop = heads[i + 1];
        const headText = textOf(h);
        const parts = [headText];
        /* Collect siblings after the heading until the next heading. Headings are
           not always siblings of their prose, so climb to a common depth first. */
        let node = h;
        while (node && node.parentElement !== main && !node.nextElementSibling) node = node.parentElement;
        for (let n = node && node.nextElementSibling; n; n = n.nextElementSibling) {
          if (stop && (n === stop || n.contains(stop))) break;
          if (n.matches && n.matches(HEAD)) break;
          parts.push(textOf(n));
        }
        const heading = headText;
        const frag = h.id
          ? '#' + h.id
          : '#:~:text=' + encodeURIComponent(heading.split(/\s+/).slice(0, 8).join(' '));
        push(frag, heading, squash(parts.join(' ')));
      });
    }
  }

  if (!records.length) push('', headingOf(main), textOf(main));
  return JSON.stringify({ title: document.title, records });
})()`;

/* ─── minimal CDP client ─────────────────────────────────────────────────────── */
async function withPage(fileUrl, fn) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${fileUrl}`, { method: 'PUT' })).json();
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
      pending.get(m.id)(m.result);
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

async function main() {
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.html') && !SKIP.has(f))
    .sort();

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-idx-'), 'profile')}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  /* Wait for the debugger to answer rather than sleeping a fixed amount. */
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/json/version`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const pages = [];
  const recs = [];
  try {
    for (const f of files) {
      const out = await withPage(`file://${path.join(ROOT, f)}`, async (send) => {
        await send('Page.enable');
        await new Promise((r) => setTimeout(r, 1300)); // let client-rendered guides paint
        const r = await send('Runtime.evaluate', { expression: EXTRACT, returnByValue: true });
        return JSON.parse(r.result.value);
      });
      const pi = pages.push([f, out.title]) - 1;
      for (const rec of out.records) recs.push([pi, rec.frag, rec.heading, rec.text]);
      process.stdout.write(`  ${f.padEnd(44)} ${String(out.records.length).padStart(3)} records\n`);
    }
  } finally {
    chrome.kill();
  }

  const index = { v: 1, pages, recs };
  const json = JSON.stringify(index);

  const chars = recs.reduce((a, r) => a + r[3].length, 0);
  console.log(
    `\n${pages.length} pages · ${recs.length} records · ${chars.toLocaleString()} chars · ${(
      json.length / 1024
    ).toFixed(0)} KB raw`
  );

  if (CHECK) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (old.trim() === json.trim()) {
      console.log('search-index.json is up to date.');
      process.exit(0);
    }
    console.error('search-index.json is STALE — run: node tools/build-search-index.mjs');
    process.exit(1);
  }

  fs.writeFileSync(OUT, json);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
