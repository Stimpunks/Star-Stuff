#!/usr/bin/env node
/**
 * check-card-order.mjs — does each card grid run in the order it claims to?
 *
 * WHY THIS EXISTS
 * On 2026-08-27, while adding No. 69, the last `<a class="card">` in document
 * order on `collection-star-stuff.html` was No. 62 — so No. 62 looked like the
 * tail of the collection. It was not. No. 63's card was sitting between Nos. 45
 * and 46, identically on the index and on the collection page, which reads as one
 * insertion replicated rather than a decision. The prev/next chain follows
 * collection order, so the misplacement made the chain look as though it ended one
 * piece early, and the new zine was very nearly wired into the middle of the
 * collection instead of onto the end of it.
 *
 * All seven existing gates passed, and none was wrong to. `check-markup.mjs`
 * derives collection membership from card *hrefs*, so a card in the wrong position
 * satisfies it completely — the map it builds is a set, and a set has no order.
 * The other six measure colour, tag structure, position on screen, paper fit,
 * sitemap agreement and findability. **Card order is none of those things**, and a
 * grid in the wrong order looks exactly like a grid in the right one unless you
 * read the numbers down the page and compare them yourself.
 *
 * Its first honest run found a second live instance the fix had missed: the
 * *Stars We Grew Up On* grid on `index.html` read 12, 66, 67, 13 — No. 13 last —
 * while its own collection page had the same four in the right order. Two pages
 * disagreeing about one collection, with nothing able to see it.
 *
 * WHY THIS IS A SOURCE CHECK — the third browser-free gate
 * Cards are static HTML: the numbers are in the file, in document order, and no
 * script builds or sorts them. Source order and DOM order were compared across
 * all fourteen card-bearing pages before this was written, and they agree
 * everywhere. So this needs no Chrome and no dependencies, which puts it beside
 * `check-markup.mjs` and `check-sitemap.mjs` rather than beside the five that
 * drive a browser. (`check-classes.mjs` is the counter-example worth remembering:
 * it *does* need a browser, because it wants the real cascade. This wants the
 * order of some text, which a file already has.)
 *
 * WHAT IT CHECKS, and — more importantly — what it deliberately does not
 *
 * 1. ASCENDING WITHIN A SERIES, WITHIN A GRID. Inside each `.artifact-grid`, the
 *    cards that carry a series number must appear in ascending order **within
 *    their own series**. `Zine No. N` is one series, `Field Guide No. N` another.
 *
 *    Series are kept separate because `collection-easter-eggs.html` interleaves
 *    them on purpose — Zine 37, Zine 47, The Hatchery, The Quillery, Field Guide
 *    13, Zine 49 — and the Zine numbers are ascending among themselves while a
 *    Field Guide sits in the middle. Checking one merged sequence would fail that
 *    page for doing exactly what it means to do.
 *
 *    Non-contiguous numbering is not a fault and is never reported. Gaps are
 *    information here: the number records *when* a piece was made, the collection
 *    records *what* it is, so 1, 2, 6, 7 is correct and 1, 2, 6, 7 with a 63 in
 *    the middle is not. Only the *direction* is checked.
 *
 * 2. CARDS OUTSIDE ANY GRID are counted and reported, never silently skipped.
 *    A card that no grid contains is a card this gate cannot check, and the
 *    lesson `build-search-index.mjs` learned the hard way — a page indexing 12% of
 *    itself looks identical to a healthy one if all you print is a count — applies
 *    just as well here. If that number is ever non-zero, the grid selector has
 *    drifted and this tool is quietly checking less than it appears to.
 *
 * NOT CHECKED: whether the index and a collection page agree with each other.
 * That sounds like the obvious companion check and it would emit noise nobody
 * should act on. Three collections are unnumbered furniture — Notes & Rationale,
 * Print and Sound — and their index grids and collection grids legitimately run in
 * different orders, because the ordering there is editorial and there is no number
 * to appeal to. The numeric case needs no cross-page check anyway: if both pages
 * are ascending within series, they already agree wherever agreement is defined.
 * The *Stars We Grew Up On* fault above was caught by rule 1 alone.
 *
 * NOT CHECKED: whether unnumbered cards are in a sensible order. There is no
 * mechanical answer to where `About` belongs relative to `Cosmic Connections`, and
 * inventing one would be this tool asserting an editorial preference.
 *
 * NOT CHECKED: whether a grid's order matches the prev/next chain. The chain is
 * checked by walking `ss-nav-next`/`ss-nav-prev` (see CLAUDE.md), which is a
 * different fact about different markup. Conflating them would mean a single
 * failure could not tell you which of the two was wrong.
 *
 * Local dev tool. Netlify does not run it. Node 22+, no Chrome, no dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(REPO);

const args = process.argv.slice(2);
const gating = args.includes('--check');
const verbose = args.includes('--verbose');
const named = args.filter((a) => !a.startsWith('--'));

const targets = named.length
  ? named
  : fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).sort();

if (!targets.length) {
  console.log('No pages to check.');
  process.exit(0);
}

const MAX_SHOWN = 8;

/* Deliberately empty, and deliberately present.
   The bar for adding an entry here is the same one check-contrast.mjs set for the
   cover watermark and check-classes.mjs set for its script hooks: an exemption must
   be a decision somebody wrote down, with a reason, not a mechanism to fall into.
   Key is "<page>#<grid index>", value is the reason. There is no pattern-matching
   escape hatch on purpose — if a grid genuinely needs to run out of numeric order,
   that is an editorial choice worth naming in one line here, and the count below
   makes a list that grows into a list somebody can question. */
const ALLOWED_UNORDERED = {
  // 'some-page.html#2': 'why this grid is ordered by something other than its numbers',
};

const decode = (s) =>
  s
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Blank out the contents of <script>, <style> and comments, keeping the string the
 * same length so every offset computed later stays valid.
 *
 * This is not defensive tidying — the decoy fixture caught it. A card anchor
 * written inside a JS template string ("<a class=\"card\" href=…") was counted as
 * a real card, and since it sat inside no grid it was reported as a card the gate
 * could not check. `check-markup.mjs` skips these regions for the same reason:
 * text that looks like markup inside a script is not markup. Blanking comments
 * also stops a commented-out <div> from unbalancing the depth walk below.
 */
function mask(src) {
  const blank = (s) => ' '.repeat(s.length);
  return src
    .replace(/<script\b[\s\S]*?<\/script>/gi, blank)
    .replace(/<style\b[\s\S]*?<\/style>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
}

/**
 * Find every `.artifact-grid` and return its [start, end) span, using balanced
 * <div> depth rather than "up to the next grid". The crude version happens to give
 * the right answer on today's pages, because nothing between two grids contains a
 * card — which is precisely the kind of accident that stops being true later.
 */
function gridSpans(src) {
  const spans = [];
  const open = /<div\b[^>]*class="[^"]*\bartifact-grid\b[^"]*"[^>]*>/g;
  let m;
  while ((m = open.exec(src))) {
    const bodyStart = m.index + m[0].length;
    let depth = 1;
    const tag = /<(\/?)div\b[^>]*>/g;
    tag.lastIndex = bodyStart;
    let t;
    let end = src.length;
    while ((t = tag.exec(src))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        end = t.index;
        break;
      }
    }
    spans.push([bodyStart, end]);
    open.lastIndex = end;
  }
  return spans;
}

/** Pull the ordered card records out of a source span. */
function cardsIn(src, from, to) {
  const seg = src.slice(from, to);
  const out = [];
  const re = /<a\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*href="([^"]*)"[\s\S]*?<\/a>/g;
  let m;
  while ((m = re.exec(seg))) {
    const href = m[1];
    const num = /class="card-number"[^>]*>([\s\S]*?)<\//.exec(m[0]);
    const label = num ? decode(num[1]) : '';
    /* "Zine No. 11 · Guest" -> series "Zine", number 11. Anything with no
       "<something> No. <digits>" carries no number and is skipped by rule 1. */
    const parsed = /^(.*?)\s*No\.\s*(\d+)/.exec(label);
    out.push({
      href,
      label,
      series: parsed ? parsed[1].trim() : null,
      number: parsed ? Number(parsed[2]) : null,
    });
  }
  return out;
}

let totalProblems = 0;
let pagesWithProblems = 0;
let totalGrids = 0;
let totalCards = 0;
let totalNumbered = 0;
let totalUnnumbered = 0;
let totalOrphans = 0;
let exemptGrids = 0;

for (const file of targets) {
  let src;
  try {
    src = mask(fs.readFileSync(file, 'utf8'));
  } catch {
    console.log(`  ${file.padEnd(42)} UNREAD  could not be read`);
    totalProblems++;
    pagesWithProblems++;
    continue;
  }

  const spans = gridSpans(src);
  const allCards = cardsIn(src, 0, src.length);
  if (!spans.length && !allCards.length) continue; // not a card-bearing page

  const problems = [];
  let pageCards = 0;
  let pageNumbered = 0;
  let pageUnnumbered = 0;

  spans.forEach(([a, b], gi) => {
    totalGrids++;
    const cards = cardsIn(src, a, b);
    pageCards += cards.length;

    const key = `${file}#${gi}`;
    if (key in ALLOWED_UNORDERED) {
      exemptGrids++;
      return;
    }

    /* One pass per series, so an interleaved grid is judged the way it is built. */
    const bySeries = new Map();
    for (const c of cards) {
      if (c.number === null) {
        pageUnnumbered++;
        continue;
      }
      pageNumbered++;
      if (!bySeries.has(c.series)) bySeries.set(c.series, []);
      bySeries.get(c.series).push(c);
    }

    for (const [series, seq] of bySeries) {
      for (let i = 1; i < seq.length; i++) {
        if (seq[i].number < seq[i - 1].number) {
          problems.push(
            `out of order   grid ${gi} · ${series} No. ${seq[i].number} follows No. ${seq[i - 1].number}` +
              `\n                       ${seq[i].href}` +
              `\n                       ${series} order in this grid: ${seq.map((c) => c.number).join(', ')}`
          );
        }
      }
    }
  });

  /* Cards no grid claimed. Reported rather than shrugged at: an uncheckable card
     is not a passing card, and a silently shrinking denominator is how a gate
     starts reading green while measuring less. */
  const inGrids = spans.reduce((n, [a, b]) => n + cardsIn(src, a, b).length, 0);
  const orphans = allCards.length - inGrids;
  if (orphans > 0) {
    totalOrphans += orphans;
    problems.push(
      `outside a grid ${orphans} card(s) sit outside any .artifact-grid and were not checked — ` +
        'the grid selector has drifted'
    );
  }

  totalCards += pageCards;
  totalNumbered += pageNumbered;
  totalUnnumbered += pageUnnumbered;

  const shown = verbose ? problems : problems.slice(0, MAX_SHOWN);
  console.log(
    `  ${file.padEnd(42)} ${problems.length ? 'FAIL' : 'ok  '}  ` +
      `${String(spans.length).padStart(2)} grid(s)  ${String(pageCards).padStart(3)} cards  ` +
      `${String(pageNumbered).padStart(3)} numbered`
  );
  for (const p of shown) console.log(`      ${p}`);
  if (problems.length > shown.length) {
    console.log(`      … and ${problems.length - shown.length} more (run with --verbose)`);
  }

  totalProblems += problems.length;
  if (problems.length) pagesWithProblems++;
}

/* Everything measured is printed as a number, for the reason the rest of tools/
   prints one: "no problems" reads identically whether the grids were walked or the
   selector matched nothing at all. */
console.log(
  `\n${totalGrids} grid(s) across ${targets.length} page(s) · ${totalCards} card(s) · ` +
    `${totalNumbered} numbered, ${totalUnnumbered} unnumbered · ${totalProblems} problem(s)`
);
if (totalUnnumbered) {
  console.log(
    `${totalUnnumbered} card(s) carry no series number and are not order-checked ` +
      '(broadsides, playlists, racks, essays — their order is editorial).'
  );
}
if (exemptGrids) {
  console.log(`${exemptGrids} grid(s) exempt by name in ALLOWED_UNORDERED.`);
}
if (totalOrphans) {
  console.log(`${totalOrphans} card(s) were outside every grid and went unchecked.`);
}

if (totalProblems) {
  console.log(
    gating
      ? `\nFAIL — ${totalProblems} ordering problem(s) on ${pagesWithProblems} page(s). Nothing on the\n` +
          'live page looks broken, which is why this needs a gate: the prev/next chain follows\n' +
          'collection order, so a card in the wrong place misreports where a collection ends.'
      : '\nRun with --check to make this gate a ship.'
  );
} else {
  console.log(
    'PASS — every card grid runs in ascending order within each series, and no card\n' +
      '       sits outside a grid where it could not be checked.'
  );
}

process.exit(gating && totalProblems ? 1 : 0);
