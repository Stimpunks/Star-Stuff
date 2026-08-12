#!/usr/bin/env node
/**
 * check-markup.mjs — finds markup the browser silently rewrites behind your back.
 *
 * WHY THIS EXISTS
 * On 2026-08-11 the Print collection page shipped with four card descriptions
 * that linked back to the piece each sheet compresses — an `<a>` nested inside
 * the `<a class="card">` wrapper. Anchors cannot nest, and the HTML parser
 * resolves that by *closing the outer anchor early*. Every affected card came
 * apart on the live page: the bordered box ended after the third line, the
 * description became an orphan block, and the card footer — its tag and arrow —
 * detached and floated in empty space below.
 *
 * Every check in this repo passed it. `check-contrast.mjs` measured the text and
 * found it legible, because it *was* legible. `build-search-index.mjs` read all
 * the words, because all the words were there. `check-sheets.mjs` only applies to
 * paper. Nothing was looking at whether the DOM still had the shape the source
 * asked for. It took a human noticing that a button was sitting on its own in the
 * dark.
 *
 * WHY THIS IS A SOURCE CHECK AND NOT A DOM CHECK — the important part
 * Three of its siblings drive headless Chrome, and this one deliberately does not.
 * (check-sitemap.mjs is the other browser-free gate, for the same reason: the
 * evidence it needs is in a file, not in a rendered page.)
 * You cannot find this fault in a DOM: by the time there is a DOM, the parser has
 * already repaired the damage. Query `document.querySelectorAll('a a')` on the
 * broken page and you get **zero results** — not because the markup was fine, but
 * because the nesting was resolved away before the tree existed. The evidence only
 * survives in the source text, which is why this reads files and never opens a
 * browser. That also makes it the fastest gate here by a wide margin: no Chrome,
 * no dependencies, whole repo in well under a second.
 *
 * WHAT IT CHECKS, and why each one is here rather than assumed
 *
 * 1. NESTED INTERACTIVE ELEMENTS — `<a>` in `<a>`, `<button>` in `<button>`, and
 *    either inside the other. This is the fault above. The parser closes the outer
 *    element, so the damage is structural: everything after the inner element
 *    falls *outside* the card, section or wrapper it was written inside.
 *
 * 2. BLOCK ELEMENT INSIDE `<p>` — `<div>`, `<section>`, `<ul>`, `<table>` and
 *    friends. Same class of fault and the same silence: a `<p>` is auto-closed the
 *    moment a block opens inside it, so any styling or spacing that belonged to
 *    the paragraph stops applying part-way through, and a trailing `</p>` lands
 *    somewhere nobody intended.
 *
 * 3. DUPLICATE `id` — because this site is built on fragments. Zines deep-link to
 *    `#spread-N`, field guides to `#entry-slug`, `starstuff.js` opens a collapsed
 *    entry by id, `search-index.json` points every record at one, and the release
 *    sections in `changelog.html` are wired to their headings with
 *    `aria-labelledby`. A duplicated id does not error; it silently sends a reader
 *    to the first match, which may not be the passage the search result promised.
 *
 * WHAT IT DOES NOT DO
 * It is not a validator and does not try to be. It does not check unclosed tags,
 * attribute syntax, or anything the browser recovers from harmlessly. Three faults,
 * chosen because each one silently changes what the reader gets.
 *
 * USAGE
 *     node tools/check-markup.mjs                       # every root .html
 *     node tools/check-markup.mjs collection-print.html # just these
 *     node tools/check-markup.mjs --check               # non-zero exit on failure
 *
 * `--check` is the gating mode, matching build-search-index.mjs, check-contrast.mjs
 * and check-sheets.mjs. A plain run always exits 0 so an informational pass does not
 * read as a crash. It prints a line per page whether it passes or fails, with the
 * count of what was actually scanned — same lesson as the coverage percentage and
 * the contrast element counts: when the only output is "it worked", a page that
 * scanned none of itself looks exactly like a clean one.
 *
 * Netlify does not run this; it is a local dev tool, same as its siblings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/* Elements that close an open <p> when they open. The HTML spec's list; trimmed to
   what can plausibly appear in this repo. */
const CLOSES_P = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
]);

const args = process.argv.slice(2);
const gating = args.includes('--check');
const named = args.filter((a) => !a.startsWith('--'));

const targets = named.length
  ? named
  : fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).sort();

if (!targets.length) {
  console.log('No pages to check.');
  process.exit(0);
}

/**
 * Walk the tags in an HTML source string.
 *
 * Deliberately skips the contents of <script> and <style> and all comments: both
 * routinely contain things that look like tags inside strings, and an earlier
 * throwaway version of this scan reported a "nested anchor" that was a selector in
 * a comment. Attribute values are tracked for quotes so that a `>` inside one — a
 * title, a description, an inline SVG path — does not end the tag early.
 */
function* tags(src) {
  let i = 0;
  /* Line numbers are tracked incrementally rather than recounted per tag. The
     obvious version — count newlines from 0 each time you need a line number — is
     O(tags × filesize), which turned a 45,000-tag repo sweep into two seconds of
     nothing but recounting the same newlines. The scan only ever moves forward, so
     carrying the count costs nothing. */
  let line = 1;
  let counted = 0;
  const lineAt = (idx) => {
    while (counted < idx) if (src.charCodeAt(counted++) === 10) line++;
    return line;
  };
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) return;

    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      i = end === -1 ? src.length : end + 3;
      continue;
    }
    if (src.startsWith('<!', lt) || src.startsWith('<?', lt)) {
      const end = src.indexOf('>', lt);
      i = end === -1 ? src.length : end + 1;
      continue;
    }

    // Find the end of this tag, respecting quoted attribute values.
    let j = lt + 1;
    let quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '>') break;
      j++;
    }
    if (j >= src.length) return;

    const raw = src.slice(lt + 1, j);
    const closing = raw.startsWith('/');
    const name = (raw.replace(/^\//, '').match(/^[A-Za-z][A-Za-z0-9-]*/) || [''])[0].toLowerCase();
    const selfClosed = raw.trimEnd().endsWith('/');

    if (name) {
      yield { name, closing, selfClosed, raw, line: lineAt(lt) };

      // Skip raw-text element bodies wholesale.
      if (!closing && !selfClosed && (name === 'script' || name === 'style')) {
        const close = src.toLowerCase().indexOf(`</${name}`, j);
        if (close !== -1) {
          i = close;
          continue;
        }
      }
    }
    i = j + 1;
  }
}

let totalProblems = 0;
let pagesWithProblems = 0;
let scannedTags = 0;
let scannedIds = 0;

for (const file of targets) {
  const full = path.join(REPO, file);
  if (!fs.existsSync(full)) {
    console.log(`  ${file.padEnd(42)} SKIP  not found`);
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');

  const problems = [];
  let openA = 0;
  let openButton = 0;
  let openP = 0;
  let tagCount = 0;
  const ids = new Map();

  for (const t of tags(src)) {
    tagCount++;

    // ── duplicate ids ──
    if (!t.closing) {
      const m = t.raw.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
      const id = m && (m[2] ?? m[3] ?? m[4]);
      if (id) {
        if (ids.has(id)) {
          problems.push(
            `duplicate id="${id}" at line ${t.line} (first seen line ${ids.get(id)}) — fragment links resolve to the first only`
          );
        } else {
          ids.set(id, t.line);
        }
      }
    }

    if (VOID.has(t.name) || t.selfClosed) continue;

    if (!t.closing) {
      // ── nested interactive ──
      if (t.name === 'a' || t.name === 'button') {
        if (openA > 0 || openButton > 0) {
          const outer = openA > 0 ? 'a' : 'button';
          problems.push(
            `<${t.name}> nested inside <${outer}> at line ${t.line} — the parser closes the outer element here, splitting everything after it out of its wrapper`
          );
        }
        if (t.name === 'a') openA++;
        else openButton++;
      }

      // ── block inside <p> ──
      if (openP > 0 && CLOSES_P.has(t.name)) {
        problems.push(
          `<${t.name}> inside <p> at line ${t.line} — auto-closes the paragraph, so its styling stops applying part-way through`
        );
      }
      if (t.name === 'p') openP = 1;
    } else {
      if (t.name === 'a') openA = Math.max(0, openA - 1);
      if (t.name === 'button') openButton = Math.max(0, openButton - 1);
      if (t.name === 'p') openP = 0;
    }
  }

  // ── ss-nav outside the content shell ──
  // The one check here that is a house convention rather than a parser repair, and it
  // earned its place the hard way: this shipped live on No. 38 and No. 39, then was
  // reintroduced on No. 40 and repeated on No. 41 — four times, twice after being fixed.
  // A page's `.ss-nav` belongs inside the centred content shell. Put it outside and the
  // header runs the full width of the window while everything beneath it sits in an
  // 820px column: flush to both edges, unpadded, misaligned with its own page. Nothing
  // else can see it. Contrast passes (the text is legible), the tag tree is valid, the
  // sitemap and chain checks never look at layout, and a DOM query finds a perfectly
  // well-formed nav — it is simply in the wrong parent. Pages with no shell at all
  // (broadsides, playlists, full-bleed sheets) are exempt by design.
  const shellAt = src.search(/<div class="[a-z-]*-shell"/);
  const navAt = src.indexOf('<nav class="ss-nav"');
  if (shellAt !== -1 && navAt !== -1 && navAt < shellAt) {
    const line = src.slice(0, navAt).split('\n').length;
    problems.push(
      `<nav class="ss-nav"> at line ${line} sits outside the content shell — the header will run full-bleed while the page below it stays in its column`
    );
  }

  scannedTags += tagCount;
  scannedIds += ids.size;

  const status = problems.length ? 'FAIL' : 'ok  ';
  console.log(
    `  ${file.padEnd(42)} ${status}  ${String(tagCount).padStart(5)} tags   ${String(ids.size).padStart(4)} ids`
  );
  for (const p of problems) console.log(`      ${p}`);

  totalProblems += problems.length;
  if (problems.length) pagesWithProblems++;
}

console.log(
  `\n${targets.length} page(s) · ${scannedTags.toLocaleString()} tags · ${scannedIds.toLocaleString()} ids · ${totalProblems} problem(s)`
);

if (totalProblems) {
  console.log(
    gating
      ? `\nFAIL — ${totalProblems} silent restructure(s) on ${pagesWithProblems} page(s). The browser will not\n` +
          'error on these; it will quietly hand the reader a different document than the one\n' +
          'in the source. Fix the markup rather than styling around the result.'
      : '\nRun with --check to make this gate a ship.'
  );
} else {
  console.log('PASS — no nested interactive elements, no blocks inside paragraphs, no duplicate ids,\n       no nav outside its content shell.');
}

process.exit(gating && totalProblems ? 1 : 0);
