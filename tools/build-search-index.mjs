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
 * WHY THE READINESS GATE IS NOT A SLEEP
 * This used to wait a flat 1300ms after Page.enable and then read the DOM, which
 * makes every build a race against a stopwatch. It lost that race in the wild on
 * 2026-08-11: one run emitted 629 records and 936,594 chars where the runs either
 * side of it gave 637 and 951,741 — eight records and 15KB gone, exit code 0, no
 * warning. A build that silently drops a page looks exactly like a healthy one,
 * which is the same failure the coverage percentage was added to catch. It also
 * made --check useless: it byte-compares, so it would report STALE seconds after
 * the generator itself had written the file.
 *
 * So the wait is now a condition, not a duration: document.readyState complete,
 * webfonts settled, and the page's own text length identical on two consecutive
 * samples. Then the extraction is run TWICE and the results must agree — the one
 * thing that actually proves we did not read mid-render — and a page that keeps
 * disagreeing is a hard error rather than a quiet truncation.
 *
 * USAGE
 *   node tools/build-search-index.mjs            # writes ../search-index.json
 *   node tools/build-search-index.mjs --check    # verify freshness, write nothing
 *   node tools/build-search-index.mjs --force    # write even if a page lost records
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
const FORCE = process.argv.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Wait until the page has stopped changing, rather than until a timer expires.
   Returns false if it never settles, so the caller can say so.

   Deliberately NOT waiting on document.fonts: we read textContent, so webfonts
   cannot change a single character we capture — and gating on them made the run
   hang, because a Google Fonts request that never resolves leaves fonts.status
   at 'loading' forever. Waiting on something that cannot affect the output is
   how a correctness gate turns into a nine-minute stall. */
const SETTLE_PROBE = `(() => JSON.stringify({
  ready: document.readyState,
  len: document.body ? document.body.textContent.length : 0,
}))()`;

/* tries × every is a ceiling, not a cost: settle() returns the moment the page
   holds still, so a fast page pays two probes. The ceiling is generous (~5s)
   because the heaviest field guides occasionally ran past a 2.4s budget on a
   loaded machine, and a page that hits the ceiling gets reported rather than
   silently trusted. */
async function settle(send, { tries = 60, every = 80 } = {}) {
  let last = -1;
  let steady = 0;
  for (let i = 0; i < tries; i++) {
    const r = JSON.parse(
      (await send('Runtime.evaluate', { expression: SETTLE_PROBE, returnByValue: true })).result.value
    );
    const quiet = r.ready === 'complete' && r.len > 0 && r.len === last;
    steady = quiet ? steady + 1 : 0;
    /* Two consecutive identical samples, not one: a page that is still building
       its entries can hold a length for a single tick between appends. */
    if (steady >= 2) return true;
    last = r.len;
    await sleep(every);
  }
  return false;
}

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
     source would come through as words.

     The brand lines were added to this list on 2026-08-08, when co-branding put
     "Stimpunks Foundation × More Realms" into the eyebrow of all 51 pages, and a
     string on every page is noise by definition. Their page-specific tails
     ("· Field Guide No. 1") go too, which is a small loss — document.title still
     carries the piece's number.

     This does not make the pair rare: colophons carry it as well, and colophons
     stay indexed because they hold the sources, credits and licence. About 42
     records still contain it, which is fine — search.html scores heading matches
     and repeat hits above a single incidental one, so the pieces that actually
     discuss More Realms still sort to the top. Stripping the eyebrows removes the
     duplication that carried no information; it doesn't pretend to remove the
     phrase. */
  const CHROME_SEL = [
    'script', 'style', 'noscript', 'template',
    '.ss-nav', '.nav', '.spread-footer-nav', '.spread-nav-btn',
    '.twinkle', '.sp-twinkle', '.controls', '.print-hint',
    '.nav-brand', '.hero-eyebrow', '.masthead-eyebrow', '.cover-issue',
    /* ls-playlist.html renders its songs twice: once as .lp-card, with the note
       saying why the song is here, and again as a flat .lp-row list headed "for
       building your Spotify and YouTube playlists manually" — same songs, same
       artists, same links, no prose. Indexing both put every song title in two
       records, one of which was 50 characters of nothing but the title. The cards
       are the content; the rows are a link list. */
    '.lp-row',
    /* index.html's jump strip repeats all twelve section names as pills, and
       every one of those names is already indexed as the heading of the section
       it points at. Indexing the strip too would put "Kin" and "Field Guides"
       in a second record that is nothing but a list of the other eleven — the
       same duplicate-presentation problem as .lp-row above. */
    '.masthead-toc',
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
        'h1,h2,h3,.spread-heading,.cover-title,.section-heading,.entry-name,' +
          '.release-title,.card-title,.stanza-mark,.lp-song'
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
  /* .lp-card, not .lp-row — see the CHROME_SEL note. Matching the row indexed 26
     records averaging 50 characters and left 84% of the playlist unfindable. */
  const chunks = [
    ...main.querySelectorAll('section, article, .card, .entry, .sp-section, .scale, .lp-card'),
  ];
  const seen = new Set();
  const kept = [];
  for (const c of chunks) {
    /* Skip a chunk whose text is already covered by an ancestor chunk. */
    if (chunks.some((o) => o !== c && o.contains(c))) continue;
    const t = textOf(c);
    if (seen.has(t)) continue;
    seen.add(t);
    const before = records.length;
    push(c.id ? '#' + c.id : '', headingOf(c), t);
    if (records.length > before) kept.push(c);
  }

  /* 3b. Segment by heading instead, when the chunker didn't actually cover the
         page. Two different failures land here:

         (a) A page that is a flat run of headings and paragraphs with no
             section/card elements at all produces no chunks, and would become one
             enormous record where a match anywhere dumps the reader at the top of
             a 40,000-character page.

         (b) A page whose chunk selectors match a few elements that hold almost
             none of its prose. about.html has exactly three .scale blocks, so the
             old records.length < 3 gate saw "3 records, good enough" and shipped
             12% of the page — the entire collaboration section, the method, the
             callouts and the sources note were unsearchable for the life of the
             index. Counting records cannot detect that; only measuring coverage
             can. Hence COVERAGE_FLOOR, checked against textOf(main).

         Where the heading has no id to link to, fall back to a text fragment
         (#:~:text=), which scrolls and highlights in Chrome, Edge and Safari and
         degrades to "top of page" everywhere else. */
  const HEAD = 'h1,h2,h3';
  /* 0.9, not something laxer: ls-playlist.html sat at 88% with its whole
     introduction and colophon uncovered, and that is exactly the kind of gap
     nobody notices. The remainder path below only ever appends text no record
     claimed, so a higher floor cannot double-index anything. */
  const COVERAGE_FLOOR = 0.9;

  /* Assign every word in root to the nearest preceding heading, so the page is
     covered exactly once with no gaps.

     This walks text nodes rather than collecting each heading's following
     siblings, and that is the whole point: prose in a different subtree from its
     heading belongs to no heading's sibling list. On about.html the <h1> lives in
     <header class="hero"> while the intro paragraphs live in the next-door
     <div class="body-text">, so a sibling walk from the h1 ran out of siblings
     inside <header> and silently dropped ~1,100 characters. Document order
     doesn't care about subtrees. */
  const segmentByHeading = (root) => {
    const clone = root.cloneNode(true);
    clone.querySelectorAll(CHROME_SEL).forEach((n) => n.remove());
    clone.querySelectorAll(BLOCK_SEL).forEach((n) => {
      n.parentNode && n.parentNode.insertBefore(document.createTextNode(' '), n);
      n.appendChild(document.createTextNode(' '));
    });

    const out = [];
    /* The lead segment holds anything before the first heading. It takes the
       page's own heading as its title, and is dropped by the length filter when
       it is only an eyebrow. */
    let cur = { frag: '', heading: headingOf(root), parts: [] };
    const flush = () => {
      const text = squash(cur.parts.join(' '));
      if (text.length >= 40) out.push({ frag: cur.frag, heading: squash(cur.heading), text });
    };

    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    );
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === 1) {
        if (!n.matches(HEAD)) continue;
        const h = squash(n.textContent);
        if (!h) continue;
        flush();
        /* Start the segment empty — the walker is about to descend into this
           heading's own text nodes, which the branch below collects. Seeding
           parts with h here would index the heading twice. */
        cur = {
          frag: n.id
            ? '#' + n.id
            : '#:~:text=' + encodeURIComponent(h.split(/\s+/).slice(0, 8).join(' ')),
          heading: h,
          parts: [],
        };
      } else {
        cur.parts.push(n.textContent);
      }
    }
    flush();
    return out;
  };

  const mainLen = textOf(main).length;
  const coverageOf = () =>
    mainLen ? records.reduce((a, r) => a + r.text.length, 0) / mainLen : 1;

  if (records.length < 3 || coverageOf() < COVERAGE_FLOOR) {
    const segs = segmentByHeading(main);
    /* Only swap if the segmenter actually did better — a page with one heading
       and no sections is still better served by the whole-page fallback below. */
    const segLen = segs.reduce((a, r) => a + r.text.length, 0);
    if (segs.length >= 2 && (!mainLen || segLen / mainLen > coverageOf())) {
      records.length = 0;
      records.push(...segs);
      kept.length = 0;
    }
  }

  /* 3c. Remainder. A chunk selector matches a page's repeating unit, not the
         prose around it, and heading segmentation can't rescue a page that has
         no headings to segment on. inclusion-safety-creed.html is both: six
         <section class="stanza"> blocks are 72% of it and a single <h1>, so its
         opening lines and its closing quotes belonged to no record at all.
         Index whatever no chunk claimed rather than losing it. Marking the
         originals and deleting them from a clone is what keeps this exact — no
         guessing, and no text counted twice.

         NOT GATED ON COVERAGE, and that is the point (fixed 2026-08-17).
         This used to run only when coverage fell under COVERAGE_FLOOR, which
         reads as a sensible "rescue the badly-covered pages" rule and is in
         fact the about.html mistake wearing a higher number. A percentage is a
         ratio; the thing this path protects is an absolute quantity of prose.
         The bigger a page's repeating unit grows, the more prose the same
         percentage hides — so the gate leaked worst on the pages that looked
         healthiest, and it leaked as a cliff rather than a slope:

           collection-star-stuff.html  93%  2,532 chars  the curatorial argument
           index.html                  97%  4,484 chars  the .collection-intro blocks
           changelog.html             100%  1,422 chars  the intro and colophon

         8,438 characters, unfindable, on the three best-scoring pages on the
         site. collection-star-stuff.html is the tell: its twelve sibling
         collection pages sit at 20–84%, so they drop through 3b and get their
         intros indexed. Star Stuff crossed 90% only by *growing* to 23 cards —
         the largest grid here — so the page was penalised for succeeding, and
         Kin (84%) and Star Gazing (79%) were queued up to lose theirs next.
         The floor stays where it is for 3b, which chooses between two ways of
         covering a page; it has no business gating a path that can only ever
         add text nobody claimed. push()'s own 40-char minimum is the right
         filter, because it measures the prose instead of the ratio.

         Segment the remainder by heading where it has headings to segment on.
         One lump was fine for inclusion-safety-creed.html, whose stray text is
         an opening and a closing around a single <h1>, and wrong for index.html,
         where the remainder is thirteen section intros interleaved between the
         card grids — as a lump they become one 4.4KB record that deep-links
         nowhere, and as segments they land on #collections and #field-guides,
         which is what those ids are for. Falls back to the lump below two
         segments, so the creed keeps the record it already had. */
  if (kept.length) {
    kept.forEach((c) => c.setAttribute('data-ss-chunk', ''));
    const rest = main.cloneNode(true);
    rest.querySelectorAll('[data-ss-chunk]').forEach((n) => n.remove());
    kept.forEach((c) => c.removeAttribute('data-ss-chunk'));
    const restSegs = segmentByHeading(rest);
    if (restSegs.length >= 2) records.push(...restSegs);
    else push('', headingOf(main), textOf(rest));
  }

  if (!records.length) push('', headingOf(main), textOf(main));
  return JSON.stringify({
    title: document.title,
    records,
    coverage: mainLen ? Math.round(coverageOf() * 100) : 100,
  });
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
  const thin = [];
  const unsettled = [];
  try {
    for (const f of files) {
      const out = await withPage(`file://${path.join(ROOT, f)}`, async (send) => {
        await send('Page.enable');
        const settled = await settle(send);

        /* Extract twice and require agreement. The settle() gate says the page
           has stopped growing; this says the thing we actually captured is the
           same thing twice. Only the second is proof, and it is what turns a
           silent 8-record loss into a retry. */
        const grab = async () =>
          (await send('Runtime.evaluate', { expression: EXTRACT, returnByValue: true })).result.value;

        let a = await grab();
        for (let attempt = 0; attempt < 3; attempt++) {
          const b = await grab();
          if (a === b) {
            if (!settled) unsettled.push(f); // captured cleanly, but it never quiesced — say so
            return JSON.parse(a);
          }
          await sleep(400);
          a = b;
        }
        throw new Error(
          `${f}: extraction never stabilised across repeated reads — the page is still ` +
            `changing after settle(). Indexing it now would write whatever half-built ` +
            `state we happened to catch.`
        );
      });
      const pi = pages.push([f, out.title]) - 1;
      for (const rec of out.records) recs.push([pi, rec.frag, rec.heading, rec.text]);
      /* Print coverage on every line, not just when it's bad. A page that indexes
         12% of itself looks exactly like a healthy one if all you print is the
         record count — that is how about.html stayed broken. */
      const cov = out.coverage ?? 100;
      if (cov < 90) thin.push([f, cov]);
      process.stdout.write(
        `  ${f.padEnd(44)} ${String(out.records.length).padStart(3)} records  ${String(cov).padStart(3)}%\n`
      );
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

  if (thin.length) {
    console.log(
      `\n${thin.length} page(s) under 90% coverage — text on these is only partly findable:`
    );
    for (const [f, c] of thin.sort((a, b) => a[1] - b[1])) console.log(`  ${String(c).padStart(3)}%  ${f}`);
    console.log('  Add a chunk selector for the page\'s own layout, or give it real headings.');
  }

  if (unsettled.length) {
    console.log(
      `\n${unsettled.length} page(s) never went quiet before extraction, though the reads agreed:`
    );
    for (const f of unsettled) console.log(`  ${f}`);
    console.log('  Check for an animation or a timer that keeps mutating text.');
  }

  /* Per-page regression guard. The failure that actually hurt was a build that
     dropped records and exited 0, and a repo-wide 1.25% dip is far too small for
     a global threshold to notice — so compare page by page against the committed
     index. Deleting content legitimately trips this; that is what --force is for. */
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const regressions = [];
  if (prev?.pages && prev?.recs) {
    const count = (ix) => {
      const m = new Map();
      ix.recs.forEach((r) => {
        const f = ix.pages[r[0]][0];
        m.set(f, (m.get(f) || 0) + 1);
      });
      return m;
    };
    const before = count(prev);
    const after = count({ pages, recs });
    for (const [f, n] of before) {
      const now = after.get(f) ?? 0;
      if (now < n) regressions.push([f, n, now]);
    }
  }

  if (regressions.length) {
    const gone = regressions.filter(([, , now]) => now === 0);
    console.log(`\n${regressions.length} page(s) produced FEWER records than the committed index:`);
    for (const [f, was, now] of regressions) console.log(`  ${f.padEnd(44)} ${was} → ${now}`);
    if (gone.length && !FORCE) {
      console.error(
        `\n${gone.length} page(s) produced NO records at all. That is what a failed render looks ` +
          `like, not an edit.` +
          (CHECK
            ? `\nNot treating this build as authoritative. Re-run without --check to see it again.`
            : `\nRefusing to overwrite a good index with it. If the text really was deleted, ` +
              `re-run with --force.`)
      );
      process.exit(1);
    }
    console.log('  If you deleted that text, this is expected. If you did not, re-run before committing.');
  }

  if (CHECK) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (old.trim() === json.trim()) {
      console.log('search-index.json is up to date.');
      process.exit(0);
    }
    console.error(
      'search-index.json is STALE — run: node tools/build-search-index.mjs\n' +
        '(If nothing changed on any page, this build disagreed with the committed one, which\n' +
        'means a page rendered differently. Re-run; a second disagreement is a real bug.)'
    );
    process.exit(1);
  }

  fs.writeFileSync(OUT, json);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
