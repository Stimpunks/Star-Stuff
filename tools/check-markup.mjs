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
 * 4. `.ss-nav` OUTSIDE THE CONTENT SHELL — the first house-convention check, and it
 *    earned its place by shipping four times. See the comment at the code below.
 *
 * 5. THE COLLECTION BADGE — the second, added 2026-08-13 after four pages were found
 *    without one. See the comment at the code below for why no other gate can see it.
 *
 * 6. EXACTLY ONE `<main>` LANDMARK — added 2026-09-01, when 130 of 159 pages had none
 *    and two field guides had two, using it as a grid container. The landmark rotor is
 *    how a screen reader skips the nav and reaches the page; two landmarks both named
 *    "main" is worse than none, because neither one is the page.
 *
 * 7. CARD-WRAP INTEGRITY — the third house-convention check, added 2026-09-01, and it
 *    earned its place by shipping twice (No. 74, then No. 83 with a written warning in
 *    front of the person doing it). A `.card-wrap` is the box: it draws the border and
 *    the accent rule and carries --card-color, and it must hold exactly one direct
 *    `<a class="card">`. Anchor a new card's insertion on the previous card's
 *    `</details>` instead of its `</div>` — one line earlier — and the new wrapper opens
 *    before the old one shuts, so the new card renders *inside* the previous card's box.
 *    The markup stays valid and the anchors stay siblings, so check 1 sees nothing.
 *    See the comment at the code below for why it is not merely cosmetic.
 *
 * 8. THE PAGE'S `<h1>` INSIDE `<main>` — the fourth house-convention check, added
 *    2026-09-01, hours after check 6, because check 6 is a *count* and a count is true
 *    of a landmark containing nothing. On 24 pages `<main>` was placed so that it held
 *    neither the title nor the page: on `index.html` it opened inside a `<div>` that
 *    closed a line later, leaving 0 characters and 0 of 137 cards; on the field guides
 *    an existing grid container had been promoted to `<main>`, so the landmark was one
 *    grid — 2 of 14 entries on one of them. One rule catches both shapes.
 *    Deliberately NOT a div-depth check: the zine template closes its shell before its
 *    main, so the parser closes main at that `</div>` — which is where it should close —
 *    and those pages measure 98-100% of their text inside it. Depth would fail ~131
 *    correct pages to catch 24 broken ones. A page with NO `<h1>` fails too: five had
 *    none — their titles being styled `<div>`s and `<span>`s, two of them with no heading
 *    element of any kind — and they were fixed the same day, so the baseline is 0.
 *
 * WHAT IT DOES NOT DO
 * It is not a validator and does not try to be. It does not check unclosed tags,
 * attribute syntax, or anything the browser recovers from harmlessly. Eight faults,
 * chosen because each one silently changes what the reader gets.
 *
 * The one edge that follows from that restraint, stated because it looks like a gap:
 * a `.card-wrap` whose `</div>` is simply missing is reported only if the file *ends*
 * with it still open. If some later `</div>` closes it by depth — an unbalanced grid,
 * say — the wrap looks closed and this check stays quiet, because unbalanced tags are
 * out of scope by design and guessing at intent would make the gate noisy.
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
      yield { name, closing, selfClosed, raw, line: lineAt(lt), index: lt };

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

/* ── the collection map ──────────────────────────────────────────────────────
   Derived from the collection pages, never from a list kept in this file. That is
   not tidiness: the site already treats those `<a class="card">` hrefs as the source
   of truth for membership, so a list here would be a second answer to the same
   question, free to drift from the first. It also means the check inherits the
   invariant CLAUDE.md states — a new piece needs its badge AND its card in the same
   pass — rather than restating half of it.

   Read for every run, including a single-page one, because you cannot tell whether
   one page needs a badge without knowing what cards it. Twelve small files. */
const COLLECTION_RE = /^collection-[a-z0-9-]+\.html$/;

/* Both sides of the name comparison come out of HTML source, so both arrive escaped
   ("Notes &amp; Rationale"). Decoding both is belt-and-braces — comparing raw would
   work today — but it means a future page written with a literal `&` still matches. */
/* Class matching is token-wise, never substring: `card-wrapper` must not answer to
   `card-wrap`, and `card-details` must not answer to `card`. */
const hasClass = (raw, cls) => {
  const m = raw.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
  if (!m) return false;
  return (m[2] ?? m[3] ?? m[4] ?? '').trim().split(/\s+/).includes(cls);
};

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');

const collectionFiles = fs.readdirSync(REPO).filter((f) => COLLECTION_RE.test(f)).sort();
const cardedBy = new Map(); // member page -> [collection file, …]
const collectionName = new Map(); // collection file -> display name

for (const cf of collectionFiles) {
  const src = fs.readFileSync(path.join(REPO, cf), 'utf8');

  /* The canonical name, taken from the collection page's own <title>, which runs
     "NAME — a Star Stuff collection — …" on all twelve. Deriving it from the
     filename instead looks tempting and is wrong: collection-notes.html is
     "Notes & Rationale", so the filename would manufacture a mismatch on a page
     that is perfectly correct. If the title format ever changes, the name check
     for that collection quietly stands down rather than failing all its members —
     an unverifiable claim is not a failing one. */
  const t = src.match(/<title>\s*([^<]*?)\s+—\s+a Star Stuff collection/i);
  if (t) collectionName.set(cf, decode(t[1]).trim());

  for (const m of src.matchAll(/<a[^>]*\bclass="card"[^>]*\bhref="([^"#]+)/g)) {
    const target = m[1];
    if (!cardedBy.has(target)) cardedBy.set(target, []);
    if (!cardedBy.get(target).includes(cf)) cardedBy.get(target).push(cf);
  }
}

/* Pages that carry no badge by decision. Deliberately an explicit, short list rather
   than a rule like "anything without a card", for the reason the contrast tool keeps
   its exemption list explicit: an exemption should be a decision somebody wrote down,
   not a mechanism a page can fall into by accident. index.html and search.html are
   utility pages; a collection page does not badge itself. Adding to this list should
   feel like a decision, because it is one. */
const NO_BADGE = new Set(['index.html', 'search.html']);
const exempt = (f) => NO_BADGE.has(f) || COLLECTION_RE.test(f);

let totalProblems = 0;
let pagesWithProblems = 0;
let scannedTags = 0;
let scannedIds = 0;
let memberPages = 0;
let badgesSeen = 0;

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

  /* The `.ss-nav` span, tracked here rather than by string search so that a nested
     <nav> cannot end it early — zines carry a second `<nav class="nav">` further
     down the page, and matching the first `</nav>` after the opening tag would be
     right only by luck. Depth-counted, so it is right on purpose. */
  let navDepth = 0;
  let ssNavStart = -1;
  let ssNavEnd = -1;
  const badges = [];

  /* Card-wrap integrity. `.card-wrap` is the box: it draws the border and the accent
     rule and carries --card-color, and it must contain exactly one `<a class="card">`
     as a direct child. Depth-counted rather than string-matched, because a wrap holds
     a `<details>` with its own `<div>` inside, so "the next </div>" is right only by
     luck. */
  let divDepth = 0;
  const wrapStack = [];
  const wrapFindings = [];

  /* The <main> landmark and the page's own <h1>, tracked in body order. Head is
     skipped: a JSON-LD blob or a meta description can contain a literal "<h1",
     and counting those reported 25 affected pages when the answer was 24. */
  let inBody = false;
  let mainOpen = -1;
  let mainClose = -1;
  let firstH1 = -1;
  let firstH1Line = 0;

  for (const t of tags(src)) {
    tagCount++;

    // ── the <main> landmark and the first <h1>, in body order ──
    if (t.name === 'body' && !t.closing) inBody = true;
    if (inBody) {
      if (t.name === 'main' && !t.closing && mainOpen === -1) mainOpen = t.index;
      if (t.name === 'main' && t.closing && mainClose === -1) mainClose = t.index;
      if (t.name === 'h1' && !t.closing && firstH1 === -1) {
        firstH1 = t.index;
        firstH1Line = t.line;
      }
    }

    // ── card-wrap integrity (see the state block above) ──
    if (t.name === 'div' && !t.selfClosed) {
      if (!t.closing) {
        divDepth++;
        if (hasClass(t.raw, 'card-wrap')) {
          if (wrapStack.length) {
            wrapFindings.push(
              `<div class="card-wrap"> at line ${t.line} opens inside the card-wrap at line ${wrapStack[wrapStack.length - 1].line} — this card renders inside the previous card's box, sharing its border and accent rule. Insert after the previous wrap's </div>, never after its </details>`
            );
          }
          wrapStack.push({ line: t.line, innerDepth: divDepth, directCards: 0 });
        }
      } else {
        const top = wrapStack[wrapStack.length - 1];
        if (top && top.innerDepth === divDepth) {
          wrapStack.pop();
          if (top.directCards !== 1) {
            wrapFindings.push(
              `<div class="card-wrap"> at line ${top.line} has ${top.directCards} direct <a class="card"> child(ren) — it must have exactly one, because the wrap is the box`
            );
          }
        }
        divDepth = Math.max(0, divDepth - 1);
      }
    }
    if (!t.closing && t.name === 'a' && hasClass(t.raw, 'card')) {
      const top = wrapStack[wrapStack.length - 1];
      if (top && top.innerDepth === divDepth) top.directCards++;
      else wrapFindings.push(`<a class="card"> at line ${t.line} is not a direct child of any <div class="card-wrap"> — it will render without the box, border or accent rule`);
    }

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

    // ── locate the .ss-nav span, and any collection badge, for the checks below ──
    if (t.name === 'nav') {
      if (!t.closing) {
        if (navDepth === 0 && /class="[^"]*\bss-nav\b/.test(t.raw)) ssNavStart = t.index;
        navDepth++;
      } else {
        navDepth = Math.max(0, navDepth - 1);
        if (navDepth === 0 && ssNavStart !== -1 && ssNavEnd === -1) ssNavEnd = t.index;
      }
    }
    /* Collected from the tag walk, not by scanning the source, so a badge quoted in a
       <script> string or sitting in a commented-out block is not mistaken for a real
       one — the same reason the nested-anchor check lives here. */
    if (t.name === 'a' && !t.closing && /class="[^"]*\bss-nav-collection(?![-\w])/.test(t.raw)) {
      badges.push({
        href: (t.raw.match(/\bhref="([^"]*)"/) || [])[1] || '',
        line: t.line,
        index: t.index,
        inNav: ssNavStart !== -1 && ssNavEnd === -1,
      });
    }

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

  // ── the page's <h1> must be inside <main> ──
  // The fourth house-convention check, added 2026-09-01, and the one the other three
  // could not have caught. The day <main> was given to every page, 24 of them got a
  // landmark that pointed at the wrong thing, and the "exactly one <main>" check above
  // passed every one of them — because it is a count, and a count is true of a landmark
  // containing nothing.
  //
  // Two shapes, and this single rule catches both. (1) <main> opened INSIDE a <div> that
  // closes before it: the parser closes main immediately and discards the real </main>,
  // so index.html shipped a main landmark holding 0 characters and 0 of its 137 cards.
  // (2) An existing container PROMOTED to <main>: <main class="field-grid"> made the
  // landmark one grid rather than the page, and being-family-field-guide.html held 2 of
  // its 14 entries. In both, the page's own <h1> ends up outside the landmark — which is
  // the property worth protecting anyway, since the title is the first thing a reader
  // jumping to main should meet.
  //
  // NOT checked by div depth, which was the obvious version and is wrong here: the zine
  // template closes its shell before its main (`</div><!-- /zine-shell --></main>`), so
  // the parser closes main at the </div> — exactly where it should close — and those
  // pages measure 98-100% of their text inside main. A depth check would fail ~131
  // correct pages to catch 24 broken ones.
  if (mainOpen !== -1 && firstH1 !== -1) {
    if (firstH1 < mainOpen) {
      problems.push(
        `<h1> at line ${firstH1Line} sits outside <main> — the landmark a screen reader jumps to does not contain the page's own title. <main> opens after the site nav closes and closes before the footer, wrapping the masthead or hero`
      );
    } else if (mainClose !== -1 && firstH1 > mainClose) {
      problems.push(`<h1> at line ${firstH1Line} sits after </main>, outside the landmark`);
    }
  }
  if (mainOpen !== -1 && firstH1 === -1) {
    /* Promoted from a counted line to a failure on 2026-09-01, the same day it was
       added, once the five pages it was counting were fixed. The count existed so it
       could shrink; it shrank to zero, so it becomes an invariant. Every page on this
       site has exactly one <h1> naming it, and a screen reader's headings rotor is
       this site's table of contents — ls-broadside.html and ls-playlist.html had NO
       heading element of any kind, so that list came back empty on them. */
    problems.push(
      `no <h1> in the body — the page has no title in its headings outline, and a screen reader's headings rotor is how a reader gets an overview of it. Promote the styled title element (a <div> or <span> carrying the cover/hero/masthead title class) to <h1>; the class already sets size, weight and colour, so pin margin/font-size on it and nothing moves`
    );
  }

  // ── card-wrap integrity ──
  // The third house-convention check, added 2026-09-01, and it earned its place the same
  // way the other two did: by shipping twice. A card is inserted after the *previous card's
  // closing `</div>`*; anchor it on that card's `</details>` instead — one line earlier —
  // and the new wrapper opens before the old one shuts, so the new card renders inside the
  // previous card's box, sharing one border, one accent rule and one Details row. It
  // happened on No. 74 and again on No. 83, the second time with a written note about it
  // in front of the person doing it, which is the definition of a fault that needs a gate
  // rather than a reminder.
  //
  // No other gate can see it, and each is right not to. The markup is *valid*: the tags
  // balance, and the two anchors are siblings rather than nested, so the nested-interactive
  // check above finds nothing. check-card-order reads card hrefs in document order, where
  // they still ascend. Contrast, overlap and dead classes are all indifferent to which
  // parent a well-formed, legible, correctly-styled card sits in.
  //
  // It is not cosmetic either. build-search-index.mjs lists `.card-wrap` ahead of `.card`
  // in its chunk selector and lets the outermost match win, so a nested pair indexes as ONE
  // record covering both cards: index.html measured 151 records nested and 152 separated,
  // meaning the newer card's text was not independently findable.
  for (const f of wrapFindings) problems.push(f);
  for (const open of wrapStack) {
    problems.push(`<div class="card-wrap"> at line ${open.line} is never closed`);
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
  /* Uses the nav located by the tag walk above rather than an exact `<nav class="ss-nav"`
     string match. The string match was blind to the 11 pages written
     `class="ss-nav ss-nav--bleed"` — harmless so far, since none of them has a shell,
     but a full-bleed page that later grows one would have been exempted by a quirk of
     how its class attribute was spelled. */
  if (shellAt !== -1 && ssNavStart !== -1 && ssNavStart < shellAt) {
    const line = src.slice(0, ssNavStart).split('\n').length;
    problems.push(
      `<nav class="ss-nav"> at line ${line} sits outside the content shell — the header will run full-bleed while the page below it stays in its column`
    );
  }

  // ── the collection badge ──
  // The second house-convention check, and the fault it is built from was found the same
  // way as the first: by a person, not by a gate. Four pages — three Print broadsides and
  // the Bowie rack — shipped with no `.ss-nav-collection` badge, so a reader landing from
  // a search result had nothing answering "where am I?".
  //
  // None of the other five gates can see this, and one of them provably cannot. The badge
  // lives inside `.ss-nav`, which `build-search-index.mjs` strips as chrome — adding it to
  // 66 pages left search-index.json *byte-identical*, which is exactly the property that
  // makes the index blind to its absence. Contrast measures the text that is there and has
  // no opinion about text that is missing; check-sheets is about paper; check-sitemap reads
  // the sitemap, where a badgeless page is listed as happily as any other; and the markup
  // itself is perfectly well-formed. A missing badge is a hole in the shape of nothing.
  //
  // Both directions matter, so both are checked. A member page must carry the badge; an
  // exempt page must not; and a page that no collection cards is reported too, because the
  // map is derived from those cards — an uncarded page cannot be checked for a badge at all,
  // and silence there would be the check quietly excusing the exact pass CLAUDE.md says to
  // do in one go.
  // ---- exactly one <main> landmark -------------------------------------------------
  // A screen reader's landmark rotor is how a reader skips the nav to reach the page. On
  // 2026-09-01, 130 of 159 pages had no <main> at all and two field guides had *two* — using it
  // as a grid container, which is invalid (one <main> per document) and leaves those readers with
  // two "main" landmarks and no way to tell which is the page. Both were fixed in that pass; this
  // is the guard so neither can come back. The sibling field guides show the convention: the
  // first grid is the <main>, every later grid is a <div class="field-grid">.
  const mains = [];
  for (const t of tags(src)) {
    if (t.name === 'main' && !t.closing) mains.push(t.line);
  }
  if (mains.length === 0) {
    problems.push(
      `no <main> landmark — a screen reader has no way to skip the nav and reach the page. Open it right after </nav> and close it before the trailing <script> and any <footer>`
    );
  } else if (mains.length > 1) {
    problems.push(
      `${mains.length} <main> elements (lines ${mains.join(', ')}) — only one is valid per document, and two landmarks named "main" is worse for a screen reader than none. Keep the first, make the rest <div class="field-grid"> as being-alone-field-guide.html does`
    );
  }

  const cards = cardedBy.get(file) || [];
  const badge = badges[0];

  if (badges.length > 1) {
    problems.push(
      `${badges.length} collection badges (lines ${badges.map((b) => b.line).join(', ')}) — a page belongs to one collection and says so once`
    );
  }

  if (exempt(file)) {
    if (badge) {
      problems.push(
        `collection badge at line ${badge.line} on a page that carries none by decision — index, search and the collection pages themselves are outside the scheme`
      );
    }
  } else if (!cards.length) {
    problems.push(
      `no collection page cards this page — membership is derived from <a class="card"> hrefs, so until one links here the badge cannot be derived or checked. Add the card and the badge in the same pass`
    );
  } else if (!badge) {
    const name = collectionName.get(cards[0]) || cards[0];
    problems.push(
      `no collection badge — this page is carded by ${cards[0]} (${name}), so a reader arriving from search has no way back to its collection. Add it as the last child of <nav class="ss-nav">`
    );
  } else {
    if (!badge.inNav) {
      problems.push(
        `collection badge at line ${badge.line} sits outside <nav class="ss-nav"> — inside the nav is what gives it the print hide and the search-index chrome strip, so out here it prints on paper and gets indexed on every page that has one`
      );
    }
    if (!cards.includes(badge.href)) {
      problems.push(
        `collection badge at line ${badge.line} points at "${badge.href}", but this page is carded by ${cards.join(', ')} — the badge and the card disagree about where this piece belongs`
      );
    } else {
      /* Name against the collection page's own title. Catches the copy-paste that
         updates the href and leaves the label, which reads to a reader as a badge
         naming one collection and leading to another. */
      const want = collectionName.get(badge.href);
      const m = src.slice(badge.index, ssNavEnd === -1 ? src.length : ssNavEnd)
        .match(/class="ss-nav-collection-name"[^>]*>([^<]*)</);
      const got = m && decode(m[1]).trim();
      if (want && got && want !== got) {
        problems.push(
          `collection badge at line ${badge.line} is labelled "${got}" but links to ${badge.href}, which calls itself "${want}"`
        );
      }
    }
  }

  if (!exempt(file)) memberPages++;
  if (badge) badgesSeen++;

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

/* Badge coverage is reported as a count, for the reason every other tool here reports
   what it measured: 76 of 76 is a fact somebody can check, where "no problems" is a
   claim that reads identically whether the map was built or came back empty. */
console.log(
  `\n${targets.length} page(s) · ${scannedTags.toLocaleString()} tags · ${scannedIds.toLocaleString()} ids · ` +
    `${badgesSeen}/${memberPages} collection badges across ${collectionFiles.length} collections · ${totalProblems} problem(s)`
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
  console.log(
    'PASS — no nested interactive elements, no blocks inside paragraphs, no duplicate ids,\n' +
      '       no nav outside its content shell, exactly one <main> landmark per page, every\n' +
      '       card in its own wrap, every page titled by exactly one <h1> inside its\n' +
      '       main landmark, every collection member badged to the collection that cards it.'
  );
}

process.exit(gating && totalProblems ? 1 : 0);
