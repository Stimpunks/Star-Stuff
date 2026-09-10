#!/usr/bin/env node
/**
 * build-derived.mjs — generate whats-new.html, feed.xml, llms.txt and security.txt.
 *
 * Renamed from build-whats-new.mjs on 2026-09-09. It had grown from one output to four
 * and the old name described a quarter of it — which is a small thing except that the
 * name is what somebody greps for when they need to know where a file comes from. The
 * coupling itself is deliberate and documented below: these four are derived from the
 * same page→collection map, and a second tool parsing those cards would be a second
 * answer free to drift from the first.
 *
 * Why this is generated and not hand-written
 * ------------------------------------------
 * CLAUDE.md's longest section is about counts that go stale because no gate can
 * read a number written out in prose. A hand-maintained "What's New" page is that
 * fault with a schedule attached: it is wrong the first time somebody ships a
 * piece and forgets the second edit. So every fact on the page — the list, the
 * dates, the totals — is derived at build time from two sources that cannot drift
 * from the site:
 *
 *   1. The collection pages' own `<a class="card">` blocks, for title and tagline.
 *      This is the same map `check-markup.mjs` builds to verify badges, so the
 *      page and the gate agree by construction. Every card carries a
 *      `.card-title` and a `.card-tagline`; both were verified present on all
 *      157 carded pages before this was written.
 *   2. `git log --diff-filter=A`, for the date the URL first existed.
 *
 * Neither is a list kept in this file, so there is no second answer free to rot.
 *
 * Easter Eggs are excluded, and that is the point of them
 * -------------------------------------------------------
 * `collection-easter-eggs.html` has no section on the index because a listed egg
 * is not off the path. A What's New page is a listing and a feed is a listing
 * pushed to people, so eggs appear in neither. They stay in `sitemap.xml`, in
 * `search-index.json` and in every gate exactly as before — findable, never
 * announced.
 *
 * Why llms.txt is generated HERE, in a tool whose name is about something else
 * ---------------------------------------------------------------------------
 * Because the alternative is worse. `llms.txt` needs the same page→collection map
 * with the same titles and taglines, and a second tool parsing `<a class="card">`
 * would be a second answer free to drift from this one — the exact fault the whole
 * file is built to avoid. So the map is read once and three files come out of it.
 * The name under-describes the tool; a duplicated parser would under-describe the
 * site, and only one of those gets a reader wrong.
 *
 * llms.txt is CURATED, and that is the whole difficulty
 * ----------------------------------------------------
 * The llms.txt convention's own list of common mistakes leads with "treating it
 * like a sitemap and listing every URL." This site has 169 pieces; emitting all of
 * them would be that mistake, and would also duplicate `sitemap.xml`, which already
 * exists and is exhaustive by design. So the file lists the ways in, what the
 * project is, how it is checked, and the seventeen collection pages that lead to
 * everything else — about forty links — and says plainly where the full list is.
 *
 * Easter Eggs are excluded here too, silently. A listing announces; an announced
 * egg is not off the path. The file does not mention the exclusion either, because
 * saying "some pages are not listed" is itself an announcement.
 *
 * And security.txt, which is here for the CHECK rather than for the generation
 * -----------------------------------------------------------------------------
 * `/.well-known/security.txt` has a mandatory `Expires:` field, and RFC 9116's own
 * guidance is to treat it like a certificate. That is this repository's signature
 * fault with a date attached: a file that is valid today, invalid in a year, and
 * silent about the transition. Hand-writing it would put the lapse on nobody's
 * calendar. So the date is one constant below, the file is generated from it, and
 * this tool FAILS while the expiry is inside 30 days — `--check` is already in the
 * ship routine, so the renewal cannot pass unnoticed. The countdown prints on every
 * run, like the exemption counts.
 *
 * The name of this tool now under-describes it twice over. See CLAUDE.md: the trade
 * is deliberate for llms.txt (it needs the card map) and merely convenient here (it
 * needs a --check that somebody runs). A rename is worth doing and is not free —
 * CLAUDE.md, the ship-zine skill and habit all name this file.
 *
 * Usage
 *   node tools/build-derived.mjs           # write all four
 *   node tools/build-derived.mjs --check   # exit non-zero if any is stale
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://starstuff.earth/';
const CHECK = process.argv.includes('--check');

const COLLECTION_RE = /^collection-[a-z0-9-]+\.html$/;
const EGGS = 'collection-easter-eggs.html';

/* Publication dates that git cannot tell the truth about. Deliberately an
   explicit, short list with a reason per line, for the same reason
   check-contrast.mjs keeps its watermark exemption explicit and
   check-classes.mjs keeps its HOOKS list by hand: an override should be a
   decision somebody wrote down, not a mechanism to fall into. The count is
   printed on its own line so a list that grows is a list somebody can question. */
/* security.txt's mandatory Expires. RFC 9116 says roughly a year and update it
   before it lapses; the check below refuses to let that be a matter of memory.
   Bump this line and re-run when the countdown gets short. */
const SECURITY_EXPIRES = '2027-09-09T00:00:00Z';
const SECURITY_RENEW_WITHIN_DAYS = 30;

const DATE_OVERRIDES = {
  // Glimmer Wire was one page from 2026-09-02 until the 2026-09-04 split, so the
  // first edition's own file was created on the 4th. Its address is its date and
  // the edition was published on the 2nd; git would file it a day and a half late.
  'glimmer-wire-2026-09-02.html': '2026-09-02T12:00:00-05:00',
};

/* ── text handling ───────────────────────────────────────────────────────────
   Card text is HTML: it carries named entities and, in taglines, <em>. An RSS
   title cannot carry `&mdash;` — that is not one of XML's five predefined
   entities, and a feed reader is entitled to reject the document over it. So
   everything is decoded to real characters first and re-escaped per output. */
const ENTS = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', middot: '·', deg: '°',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  hellip: '…', times: '×', eacute: 'é', uuml: 'ü',
};

function decodeEnts(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, body) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return body in ENTS ? ENTS[body] : m;
  });
}

const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const collapse  = (s) => s.replace(/\s+/g, ' ').trim();

/* HTML escape for text going back into the generated page. The page keeps <em>,
   so tagline markup is re-inserted after escaping rather than escaped away. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* XML needs only these three in element content; quotes matter in attributes. */
const xesc = (s) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Keep <em> as real emphasis on the page: escape the text, then unescape just
   the em tags. Nothing else is allowed through, so a stray tag in a card cannot
   reach the generated page as markup. */
const withEm = (s) => esc(s).replace(/&lt;(\/?)em&gt;/g, '<$1em>');

/* ── read the cards ──────────────────────────────────────────────────────── */
function field(block, cls) {
  const m = block.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</(?:div|p)>`));
  return m ? collapse(m[1]) : '';
}

const collections = fs.readdirSync(REPO)
  .filter((f) => COLLECTION_RE.test(f))
  .sort();

const records = [];
const seen = new Map();          // href → first collection that carded it
let eggsSkipped = 0;

for (const cf of collections) {
  const src = fs.readFileSync(path.join(REPO, cf), 'utf8');
  const titleTag = src.match(/<title>([\s\S]*?)<\/title>/);
  const colName = titleTag
    ? collapse(decodeEnts(titleTag[1]).split('—')[0])
    : cf.replace(/^collection-|\.html$/g, '');

  for (const m of src.matchAll(/<a class="card" href="([^"#]+)"[\s\S]*?<\/a>/g)) {
    const href = m[1];
    if (cf === EGGS) { eggsSkipped++; continue; }
    if (seen.has(href)) continue;   // a page carded twice is one publication
    seen.set(href, cf);

    const title   = decodeEnts(stripTags(field(m[0], 'card-title')));
    const tagline = decodeEnts(field(m[0], 'card-tagline'));   // keeps <em>
    const number  = decodeEnts(stripTags(field(m[0], 'card-number')));

    if (!title || !tagline) {
      console.error(`  FAIL  ${href}: card on ${cf} is missing a ${title ? 'tagline' : 'title'}`);
      process.exitCode = 1;
      continue;
    }
    records.push({ href, title, tagline, number, collection: colName, collectionFile: cf });
  }
}

/* ── date each record ────────────────────────────────────────────────────── */
function addedAt(file) {
  if (DATE_OVERRIDES[file]) return DATE_OVERRIDES[file];
  const out = execFileSync(
    'git',
    ['log', '--diff-filter=A', '--reverse', '--format=%aI', '--', file],
    { cwd: REPO, encoding: 'utf8' },
  );
  return out.split('\n')[0].trim();
}

for (const r of records) {
  r.iso = addedAt(r.href);
  if (!r.iso) {
    console.error(`  FAIL  ${r.href}: no git add-date.`);
    console.error('        A page\'s publication date is the commit that added it, so an');
    console.error('        uncommitted page has no date. Commit the piece first, then run');
    console.error('        this and commit whats-new.html and feed.xml alongside it.');
    process.exitCode = 1;
  }
  r.day = (r.iso || '').slice(0, 10);
}
if (process.exitCode) process.exit(1);

/* Newest first. Ties inside one commit keep collection-page order, which is the
   only ordering that exists for the eighteen files of the launch import. */
records.sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));

/* ── group by day ────────────────────────────────────────────────────────── */
const days = [];
for (const r of records) {
  if (!days.length || days[days.length - 1].day !== r.day) days.push({ day: r.day, items: [] });
  days[days.length - 1].items.push(r);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
function longDate(day) {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function rfc822(iso) {
  const dt = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  const off = -dt.getTimezoneOffset();
  const sign = off < 0 ? '-' : '+';
  const oh = p(Math.floor(Math.abs(off) / 60));
  const om = p(Math.abs(off) % 60);
  return `${DOW[dt.getDay()]}, ${p(dt.getDate())} ${MONTHS[dt.getMonth()].slice(0, 3)} `
       + `${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())} `
       + `${sign}${oh}${om}`;
}

/* ── the accent a collection carries, so the list reads as the site does ──── */
const ACCENTS = {
  'collection-star-stuff.html': '#fbbf24',
  'collection-star-gazing.html': '#a78bfa',
  'collection-more-than-human.html': '#4ade80',
  'collection-kin.html': '#22d3ee',
  'collection-stars-we-grew-up-on.html': '#f472b6',
  'collection-how-we-got-here.html': '#22d3ee',
  'collection-field-guides.html': '#4ade80',
  'collection-glimmers.html': '#fbbf24',
  'collection-glimmer-wire.html': '#22d3ee',
  'collection-triggers.html': '#f472b6',
  'collection-print.html': '#f472b6',
  'collection-sound.html': '#a78bfa',
  'collection-start-here.html': '#fbbf24',
  'collection-foundations.html': '#a78bfa',
  'collection-notes.html': '#4ade80',
};
const accent = (f) => ACCENTS[f] || '#a78bfa';

/* ── the page ────────────────────────────────────────────────────────────── */
const NEWEST = records[0];
const DESC = `Everything published on Star Stuff, newest first — ${records.length} zines, `
  + 'field guides, broadsides, racks and working papers, each with the line it '
  + 'leads with. Subscribe by RSS, or read the changelog for the reasoning.';

function buildHtml() {
  const listing = days.map((d) => {
    const items = d.items.map((r) => `
        <li class="entry" style="--entry-accent:${accent(r.collectionFile)};">
          <a class="entry-title" href="${xesc(r.href)}">${esc(r.title)}</a>
          <p class="entry-tagline">${withEm(r.tagline)}</p>
          <p class="entry-meta">${esc(r.number)} <span aria-hidden="true">·</span> <a class="entry-collection" href="${xesc(r.collectionFile)}">${esc(r.collection)}</a></p>
        </li>`).join('');
    return `
      <section class="day">
        <h2 class="day-date" id="d-${d.day}"><time datetime="${d.day}">${longDate(d.day)}</time></h2>
        <ul class="entries">${items}
        </ul>
      </section>`;
  }).join('');

  /* The whole listing goes inside one container that build-search-index.mjs
     strips as chrome — the date headings too, not just the cards. Wrapping only
     the <ul>s left 33 date strings outside every record and the page reported
     62% coverage, which is the search index correctly saying "you have prose here
     that nothing indexes". The dates are part of the duplicate presentation, so
     the honest fix is to exclude the whole listing rather than to index a heading
     whose entire body has been removed. */
  const listingBlock = `\n  <div class="whats-new-list">${listing}\n  </div>`;

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "What's New — Star Stuff",
    description: DESC,
    url: `${SITE}whats-new.html`,
    isPartOf: { '@type': 'WebSite', name: 'Star Stuff', url: SITE },
    publisher: [
      { '@type': 'Organization', name: 'Stimpunks Foundation', url: 'https://stimpunks.org/', logo: { '@type': 'ImageObject', url: `${SITE}og-card.jpg` } },
      { '@type': 'Organization', name: 'More Realms', url: 'https://morerealms.com/' },
    ],
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: records.length,
      itemListElement: records.slice(0, 20).map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: SITE + r.href,
        name: r.title,
      })),
    },
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0a0a14">
<link rel="canonical" href="${SITE}whats-new.html">
<link rel="alternate" type="application/rss+xml" title="Star Stuff — What's New" href="feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta name="description" content="${xesc(DESC)}">
<!-- Open Graph / link unfurl -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Star Stuff · Stimpunks Foundation × More Realms">
<meta property="og:url" content="${SITE}whats-new.html">
<meta property="og:title" content="What's New — Star Stuff">
<meta property="og:description" content="${xesc(DESC)}">
<meta property="og:image" content="${SITE}og-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A rainbow-hued cosmic image — we are all made of star stuff.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="What's New — Star Stuff">
<meta name="twitter:description" content="${xesc(DESC)}">
<meta name="twitter:image" content="${SITE}og-card.jpg">
<title>What's New — Star Stuff — Stimpunks × More Realms</title>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="starstuff.css">
<style>
  :root {
    --void:  var(--sp-void-deep);
    --card:  var(--sp-card);
    --violet:var(--sp-purple);
    --pink:  var(--sp-pink);
    --gold:  var(--sp-gold);
    --cyan:  var(--sp-cyan);
    --green: var(--sp-green);
    /* One knob for this page's tint. Green keeps What's New distinct from
       Search (violet), About (gold) and Changelog (cyan). */
    --accent: var(--sp-green);
    --star-white: var(--sp-white-soft);
    --stardust:   var(--sp-secondary-soft);
    --dim:   var(--sp-dim);
    --dim2:  var(--sp-dim-soft);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    background: var(--void);
    font-family: 'Atkinson Hyperlegible Next', system-ui, sans-serif;
    color: var(--star-white);
    min-height: 100vh;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 8% 12%, rgba(251,191,36,0.85) 0%, transparent 100%),
      radial-gradient(1px 1px at 22% 38%, rgba(244,244,251,0.6) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 44% 9%, rgba(244,114,182,0.7) 0%, transparent 100%),
      radial-gradient(1px 1px at 61% 68%, rgba(34,211,238,0.6) 0%, transparent 100%),
      radial-gradient(2px 2px at 74% 28%, rgba(167,139,250,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 84% 54%, rgba(74,222,128,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 91% 79%, rgba(244,244,251,0.7) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 4% 58%, rgba(251,191,36,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 34% 84%, rgba(244,244,251,0.6) 0%, transparent 100%),
      radial-gradient(2px 2px at 19% 88%, rgba(167,139,250,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 69% 4%, rgba(244,244,251,0.8) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 30% 20%, rgba(74,222,128,0.5) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  .doc-shell { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

  .spectrum-line { height: 2px; border: none; border-radius: 2px; background: linear-gradient(90deg, var(--violet), var(--pink), var(--gold), var(--cyan), var(--green)); }

  .nav-brand { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.35em; text-transform: uppercase; color: var(--dim); margin: 1.6rem 0 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(167,139,250,0.2); }

  .hero { margin-bottom: 2rem; }
  .hero-eyebrow { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.36em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.3rem; }
  .hero-title { font-weight: 700; font-size: clamp(2.1rem, 6vw, 3.4rem); line-height: 1.05; letter-spacing: -0.02em; color: var(--star-white); margin-bottom: 1.1rem; }
  .hero-title em { font-style: normal; background: linear-gradient(90deg, var(--violet), var(--pink), var(--gold), var(--cyan), var(--green)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-sub { font-size: 1.02rem; line-height: 1.6; color: var(--stardust); max-width: 38rem; }
  .hero-sub + .hero-sub { margin-top: 0.9rem; }
  .hero-sub a { color: var(--accent); text-decoration: none; border-bottom: 1px solid rgba(74,222,128,0.4); }
  .hero-sub a:hover { color: var(--star-white); border-bottom-color: var(--star-white); }
  .hero-rule { width: 200px; max-width: 55%; margin-top: 1.6rem; }

  /* ── subscribe strip ── */
  .subscribe { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem 1rem; margin: 2rem 0 0.5rem; padding: 1rem 1.15rem; background: var(--card); border: 1px solid rgba(74,222,128,0.28); border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0; }
  .subscribe-label { font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); }
  .subscribe-text { font-size: 0.94rem; line-height: 1.65; color: var(--stardust); flex: 1 1 16rem; min-width: 0; }
  .subscribe-link { display: inline-block; font-family: 'Space Mono', monospace; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); padding: 0.45rem 1.05rem; border: 1px solid rgba(74,222,128,0.5); border-radius: 999px; text-decoration: none; white-space: nowrap; }
  .subscribe-link:hover, .subscribe-link:focus-visible { background: rgba(74,222,128,0.14); color: var(--star-white); border-color: var(--accent); }

  /* ── the listing ── */
  .day { margin-top: 2.6rem; }
  .day-date { font-family: 'Space Mono', monospace; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: var(--accent); margin: 0 0 1rem; padding-bottom: 0.55rem; border-bottom: 1px solid rgba(74,222,128,0.22); scroll-margin-top: 2rem; }

  .entries { list-style: none; margin: 0; padding: 0; }
  .entry { margin: 0 0 1.35rem; padding-left: 0.95rem; border-left: 3px solid var(--entry-accent, var(--accent)); }
  .entry:last-child { margin-bottom: 0; }
  .entry-title { display: block; font-size: 1.08rem; font-weight: 700; line-height: 1.35; color: var(--star-white); text-decoration: none; border-bottom: 1px solid transparent; }
  .entry-title:hover, .entry-title:focus-visible { color: var(--entry-accent, var(--accent)); }
  .entry-tagline { margin-top: 0.3rem; font-size: 0.96rem; line-height: 1.65; color: var(--stardust); }
  .entry-tagline em { font-style: italic; color: var(--star-white); }
  .entry-meta { margin-top: 0.35rem; font-family: 'Space Mono', monospace; font-size: 0.56rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dim); }
  .entry-collection { color: var(--entry-accent, var(--accent)); text-decoration: none; border-bottom: 1px solid transparent; }
  .entry-collection:hover, .entry-collection:focus-visible { border-bottom-color: currentColor; }

  .colophon-footer { font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.26em; text-transform: uppercase; color: var(--dim); line-height: 2.2; margin-top: 3rem; padding-top: 1.4rem; border-top: 1px solid rgba(167,139,250,0.14); }
  .colophon-footer a { color: var(--stardust); text-decoration: none; border-bottom: 1px solid rgba(167,139,250,0.2); }
  .colophon-footer a:hover { color: var(--star-white); }

  @media (max-width: 600px) {
    .doc-shell { padding: 2rem 1.3rem 3rem; }
    .subscribe { flex-direction: column; align-items: flex-start; }
  }

  @media print {
    body::before { display: none; }
    .doc-shell { max-width: none; padding: 0; }
    .subscribe { border-color: #999999; background: none; }
    .entry { break-inside: avoid; }
  }
</style>
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

<div class="doc-shell">

  <nav class="ss-nav" style="--nav-accent:#4ade80;" aria-label="Star Stuff collection">
    <span class="ss-nav-home-group">
      <a class="ss-nav-home" href="index.html"><span class="ss-star" aria-hidden="true">★</span> stuff</a>
      <a class="ss-nav-about" href="about.html">about</a>
      <a class="ss-nav-search" href="search.html">search</a>
    </span>
  </nav>
<main id="main" tabindex="-1">

  <div class="nav-brand"><a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · What's New</div>

  <header class="hero">
    <div class="hero-eyebrow"><a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks Foundation</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · Newest First</div>
    <h1 class="hero-title">What&rsquo;s <em>New</em></h1>
    <p class="hero-sub">Everything published here, newest first &mdash; ${records.length} pieces across ${collections.length - 1} collections, each with the line it leads with. Nothing else: no reasoning, no corrections, no method. If you want those, the <a href="changelog.html">changelog</a> is where we publish our own errors.</p>
    <p class="hero-sub">This page is generated from the collection pages and from git, so the list and the dates cannot drift from the site. A date is the day the piece first went live at its own address.</p>
    <hr class="spectrum-line hero-rule">
  </header>

  <div class="subscribe">
    <span class="subscribe-label">Subscribe</span>
    <p class="subscribe-text">New pieces arrive by RSS, so you don&rsquo;t have to come back and check. No account, no email, no tracking &mdash; your reader fetches a file.</p>
    <a class="subscribe-link" href="feed.xml">RSS feed</a>
  </div>
${listingBlock}

  <div class="colophon-footer">
    <a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks Foundation</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · <a href="https://starstuff.earth">starstuff.earth</a> · <a href="about.html">About</a> · <a href="search.html">Search</a> · <a href="changelog.html">Changelog</a> · <a href="feed.xml">RSS</a><br>
    Generated by <code>tools/build-derived.mjs</code> · Print freely · Share freely · <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · L★S
  </div>

</div><!-- /doc-shell --></main>

</body>
</html>
`;
}

/* ── the feed ────────────────────────────────────────────────────────────── */
/* The brand colour, read off the pages rather than restated here, because the
   manifest is the third place it would otherwise be written down (after each page's
   <meta name="theme-color"> and starstuff.css's --sp-void). The modal value wins and
   the run says how lopsided the vote was: 197 of 198 pages carry #0a0a14 and one
   print-first sheet carries #ffffff, which is correct for that page and must not
   become the manifest's answer. */
const themeVotes = {};
for (const f of fs.readdirSync(REPO).filter((f) => f.endsWith('.html'))) {
  const m = fs.readFileSync(path.join(REPO, f), 'utf8')
    .match(/<meta\s+name="theme-color"\s+content="([^"]+)"/i);
  if (m) themeVotes[m[1]] = (themeVotes[m[1]] || 0) + 1;
}
const themeRanked = Object.entries(themeVotes).sort((a, b) => b[1] - a[1]);
if (!themeRanked.length) {
  console.error('No <meta name="theme-color"> on any page — the manifest would invent a colour.');
  process.exit(1);
}
const THEME_COLOUR = themeRanked[0][0];

const FEED_ITEMS = 50;

function buildFeed() {
  const items = records.slice(0, FEED_ITEMS).map((r) => {
    /* The description is escaped HTML, which is what RSS 2.0 expects and what
       every reader renders. <em> survives; nothing else is let through. The
       designation gets its own paragraph rather than being glued to the tagline
       with a separator: several card numbers already contain a middle dot
       ("Rack · One scene"), so a third one would read as punctuation noise. */
    const body = `<p><em>${esc(r.number)} — ${esc(r.collection)}</em></p>`
               + `<p>${withEm(r.tagline)}</p>`;
    return `    <item>
      <title>${xesc(r.title)}</title>
      <link>${SITE}${xesc(r.href)}</link>
      <guid isPermaLink="true">${SITE}${xesc(r.href)}</guid>
      <pubDate>${rfc822(r.iso)}</pubDate>
      <category>${xesc(r.collection)}</category>
      <description>${xesc(body)}</description>
    </item>`;
  }).join('\n');

  /* lastBuildDate is the newest item's date, not the clock. A feed that changed
     on every run would make --check report STALE seconds after a clean write,
     which is the fault build-search-index.mjs already hit once for another reason. */
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>Star Stuff</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xesc(DESC)}</description>
    <language>en</language>
    <copyright>CC BY-SA 4.0 · Stimpunks Foundation × More Realms</copyright>
    <lastBuildDate>${rfc822(NEWEST.iso)}</lastBuildDate>
    <sy:updatePeriod>${SY_PERIOD}</sy:updatePeriod>
    <sy:updateFrequency>${SY_FREQUENCY}</sy:updateFrequency>
    <image>
      <url>${SITE}og-card.jpg</url>
      <title>Star Stuff</title>
      <link>${SITE}</link>
    </image>
${items}
  </channel>
</rss>
`;
}

/* ── llms.txt ─────────────────────────────────────────────────────────────────
   v2 of the convention. Structure is fixed by the proposal: `# Site name` first,
   a `>` blockquote, free prose, then `##` sections of markdown links. The one hard
   v2 addition is discovery — the file must be advertised with rel="describedby"
   rather than guessed at, which is done in `_headers` (an HTTP Link header, so it
   reaches an agent that never parses our HTML) and in index.html's head.

   `## Optional` is deliberately absent. v1 gave that heading mechanical semantics
   for context-expansion tooling and v2 dropped both; using it now would imply a
   meaning the convention has explicitly withdrawn. */

/* A collection page is not carded by any other collection page, so it has no
   tagline to lift. Its own <meta name="description"> is the authored one-liner,
   trimmed to its first sentence — same principle as the taglines: text the page
   already publishes about itself, not a summary kept in this tool. */
function metaDescription(file) {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  /* Read all three and take the SHORTEST. Several pages carry a purpose-written
     twitter:description that is already one complete sentence, which beats
     truncating a 487-character meta description — and truncation here produced
     "side A is a face you'd…" on the first run. Where all three are identical the
     shortest is just the one, so this costs nothing. */
  const cands = [...src.matchAll(/<meta (?:name|property)="(?:description|og:description|twitter:description)" content="([^"]*)"/g)]
    .map((m) => collapse(decodeEnts(m[1])))
    .filter((d) => d.length > 20);
  if (!cands.length) return '';
  let d = cands.sort((a, b) => a.length - b.length)[0];

  /* Trim to a whole sentence where one ends inside the cap. Failing that, cut at
     the last clause boundary rather than mid-phrase, and only then add an ellipsis
     — a fragment that stops at a comma reads as an abridgement; one that stops
     mid-list reads as a bug. */
  const CAP = 230;
  const sentence = d.search(/[.!?](?:\s+[A-Z“"]|$)/);
  if (sentence > 60 && sentence < CAP) return d.slice(0, sentence + 1);
  if (d.length <= CAP) return d;
  const cut = d.slice(0, CAP);
  const boundary = Math.max(cut.lastIndexOf('; '), cut.lastIndexOf(' — '), cut.lastIndexOf(', '));
  return (boundary > 80 ? cut.slice(0, boundary) : cut.replace(/\s+\S*$/, '')) + '…';
}

function collectionTitle(file) {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const t = src.match(/<title>([\s\S]*?)<\/title>/);
  return t ? collapse(decodeEnts(t[1]).split('—')[0]) : file;
}

/* Asked of the filesystem rather than of a list, so this tool and
   build-markdown.mjs cannot disagree about which pages have a sibling. 56 of 198 do;
   the artifact pages deliberately do not. */
const hasMd = (href) => fs.existsSync(path.join(REPO, href.replace(/\.html$/, '.md')));
const mdLink = (href) => (hasMd(href) ? ` [Markdown](${SITE}${href.replace(/\.html$/, '.md')})` : '');

function buildLlms() {
  const bySection = (cf) => records.filter((r) => r.collectionFile === cf);
  const line = (r) => `- [${r.title}](${SITE}${r.href}): ${stripTags(r.tagline)}${mdLink(r.href)}`;

  const groups = [
    ['Start here', 'collection-start-here.html'],
    ['What this project is', 'collection-foundations.html'],
    ['How it is made, and how it is checked', 'collection-notes.html'],
  ];

  const out = [];
  out.push('# Star Stuff');
  out.push('');
  out.push('> Printable, shareable web artifacts about difference — zines, field guides and'
    + ' broadsides that take one settled fact and follow it until a claim about belonging is'
    + ' already inside it. A collaboration between the Stimpunks Foundation and More Realms.');
  out.push('');
  out.push('The through-line is that the universe does not pathologize its own variation, read'
    + ' through the neurodiversity paradigm: difference is variation, not deficit. Two threads'
    + ' braid together — Carl Sagan\'s cosmology, and the finding that bone is piezoelectric.');
  out.push('');
  out.push('Editorial conventions worth knowing if you quote from here. We write about'
    + ' neurodivergent and disabled people in the first person plural — we, us, our — because'
    + ' we write from inside that community. *Autistic* is capitalised as an identity term;'
    + ' *autism* is not. Quotations are traced to primary sources and every piece records its'
    + ' sources, its open questions and its corrections in FACTCHECK.md; corrections are'
    + ' published by date in the changelog rather than quietly fixed.');
  out.push('');
  /* COUNTED, not typed. The first version of this sentence carried a hardcoded 56 and
     was wrong within the hour, when a misclassified page gained a sibling — the exact
     fault CLAUDE.md's longest section is about, committed in a sentence about being
     machine-readable. Both figures come off the filesystem. */
  const htmlPages = fs.readdirSync(REPO).filter((f) => f.endsWith('.html'));
  const withMd = htmlPages.filter((f) => hasMd(f)).length;
  out.push('Where a link below is followed by [Markdown], that page has a Markdown sibling at'
    + ' the same address with .md appended, derived from the page\'s own <main> landmark and'
    + ` advertised from its <head>. **${withMd} of the ${htmlPages.length} pages have one.** The other`
    + ` ${htmlPages.length - withMd} deliberately do not: the zines, field guides and print sheets`
    + ' carry part of their argument in figures, and a Markdown copy would be their prose with the'
    + ' diagrams silently missing. Where a page does have a sibling and something was still'
    + ' dropped, its frontmatter says so.');
  out.push('');
  out.push('This index is curated, not exhaustive. It lists the ways in, the working papers,'
    + ` and the ${collections.length - 1} collection pages that lead to everything else.`
    + ` The complete list of all ${records.length} pieces is at ${SITE}whats-new.html, and`
    + ` ${SITE}sitemap.xml is exhaustive.`);
  out.push('');

  for (const [heading, cf] of groups) {
    const rows = bySection(cf);
    if (!rows.length) continue;
    out.push(`## ${heading}`);
    out.push('');
    out.push(`${metaDescription(cf)} — [${collectionTitle(cf)}](${SITE}${cf})${mdLink(cf)}`);
    out.push('');
    for (const r of rows) out.push(line(r));
    out.push('');
  }

  out.push('## Collections');
  out.push('');
  out.push('Each collection page argues for why its pieces belong together, and states the axis'
    + ' it sorts on — register, form, medium, occasion, issue or audience. The collections were'
    + ' observed in finished work rather than planned, so several say on their own face where'
    + ' they break their own rules.');
  out.push('');
  for (const cf of collections) {
    if (cf === EGGS) continue;
    if (groups.some(([, g]) => g === cf)) continue;   // already listed above with its members
    out.push(`- [${collectionTitle(cf)}](${SITE}${cf}): ${metaDescription(cf)}${mdLink(cf)}`);
  }
  out.push('');

  out.push('## Machine-readable');
  out.push('');
  out.push(`- [Sitemap](${SITE}sitemap.xml): Every page on the site, with last-modified dates.`);
  out.push(`- [RSS feed](${SITE}feed.xml): The 50 most recent pieces, newest first.`);
  out.push(`- [What's New](${SITE}whats-new.html): Every piece, newest first, with the line each one leads with.`);
  out.push(`- [Search index](${SITE}search-index.json): The full-text index the in-browser search reads — one record per zine spread and per field-guide entry.`);
  out.push(`- [Source repository](https://github.com/Stimpunks/Star-Stuff): Every page, every generator, and the eight checks that gate a change.`);
  out.push('');

  return out.join('\n');
}

/* ── security.txt ─────────────────────────────────────────────────────────────
   RFC 9116. Contact points at GitHub's private vulnerability reporting rather than
   at an inbox: the source is public, so an issue would disclose a report the moment
   it was filed, and a draft advisory is private until we publish it. It also means
   no address is published — and the spec's warning is that an UNMONITORED contact is
   worse than no file at all, which a general contact form on a small nonprofit's
   site would have been. Fields kept to the ones that are true: no Encryption (no
   PGP key) and no Acknowledgments (no hall of fame) rather than empty gestures. */
function buildSecurityTxt() {
  return [
    '# Star Stuff — starstuff.earth',
    '# Stimpunks Foundation × More Realms',
    '#',
    '# A static site: no server-side code, no accounts, no database, no cookies. The',
    '# full policy, including what is in scope and what is not, is at the Policy URL',
    '# below. Please use the private channel — issues on the repository are public the',
    '# moment they are opened.',
    '',
    'Contact: https://github.com/Stimpunks/Star-Stuff/security/advisories/new',
    'Policy: https://github.com/Stimpunks/Star-Stuff/blob/main/SECURITY.md',
    `Expires: ${SECURITY_EXPIRES}`,
    'Preferred-Languages: en',
    `Canonical: ${SITE}.well-known/security.txt`,
    '',
  ].join('\n');
}

/* ── The feed's declared cadence (RSS Syndication module) ──────────────────────
   A cadence is a PROMISE, and the spec's own common-mistakes list warns that
   aggregators back off from a feed that is stale relative to what it declares. So
   this is derived rather than chosen: measured 2026-09-10, the site published 109
   pages across 25 of the last 28 days — about 3.9 a day.

   `daily` with a frequency of ONE, not four, and the difference is which way the
   number cuts. sy:updateFrequency is polls per period, so declaring four asks polite
   readers to fetch four times as often for no gain: the feed carries 50 items at
   roughly 3.9 pieces a day, which is about thirteen days of headroom, so a reader
   polling once a day cannot miss an item. Under-declaring costs a few hours of
   latency on a zine collection; over-declaring costs everybody bandwidth.

   Re-derive before changing it — `git log --diff-filter=A` per page, grouped by day —
   and note that the honest number is the recent rate, not the all-time one: the
   all-time figure is 3.6 a day and the site was slower in July. */
const SY_PERIOD = 'daily';
const SY_FREQUENCY = 1;

/* ── site.webmanifest ─────────────────────────────────────────────────────────
   Generated, not hand-written, for one reason: the icon list and the theme colour
   are a SECOND description of things that live elsewhere, and a hand-kept copy of
   either is the drift this whole tool exists to prevent. The icons are checked
   against the filesystem and the theme colour is read off the pages.

   `display: minimal-ui`, deliberately, and not `standalone`. This site is a chain of
   pages — every piece carries prev/next and a collection badge — and standalone hides
   the browser's own back affordance on Android, which would strand a reader inside a
   reading order they cannot walk back up. minimal-ui installs and keeps the way out.
   `fullscreen` would be worse again and the spec names it as a mistake. */
function buildManifest() {
  const icons = [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
  for (const i of icons) {
    if (!fs.existsSync(path.join(REPO, i.src.replace(/^\//, '')))) {
      console.error(`\n  site.webmanifest names ${i.src}, which is not in the repo.`
        + `\n  Run: node tools/build-icons.mjs`);
      process.exit(1);
    }
  }
  return JSON.stringify({
    name: 'Star Stuff · Stimpunks Foundation × More Realms',
    short_name: 'Star Stuff',
    description: 'Printable, shareable web artifacts about piezoelectric bone, stellar'
      + ' nucleosynthesis and the neurodiversity paradigm.',
    start_url: '/',
    scope: '/',
    display: 'minimal-ui',
    background_color: THEME_COLOUR,
    theme_color: THEME_COLOUR,
    lang: 'en',
    icons,
  }, null, 2) + '\n';
}

/* ── /.well-known/api-catalog (RFC 9727, as an RFC 9264 Linkset) ──────────────
   One predictable fetch that lists every machine-readable thing on the origin, so an
   agent never has to guess a path. Advertised with `Link: rel="api-catalog"` in
   _headers — that relation is what RFC 9727 registered, and the spec's own mistake
   list calls out pairing it with `describedby` instead.

   ONLY IANA-REGISTERED RELATIONS APPEAR HERE, AND THAT IS WHY TWO THINGS ARE MISSING.
   Checked against the IANA link-relations registry on 2026-09-10 (236 entries):
   `sitemap` and `security` are NOT in it. Both were in this site's Link header, and
   CLAUDE.md claimed every relation there was registered; both are now gone from it.
   RFC 8288 allows an extension relation only as a full URI, never as a bare token, so
   an unregistered token is not a lax choice but an invalid one.

   Nothing is lost by leaving them out. robots.txt already carries `Sitemap:`, which is
   the canonical discovery mechanism and the one every crawler reads; security.txt is
   found at its well-known path, which is the whole point of a well-known path.

   Worth knowing if you compare this against the spec page: the spec's own worked
   example uses a `sitemap` key and lists it under "useful relations", while the same
   page says to use only registered names. Those cannot both hold. The registry is
   the authority it cites, so the registry wins here.

   The 57 Markdown siblings are deliberately absent too — each is advertised on its own
   page with `<link rel="alternate">`, llms.txt describes the site as a whole, and the
   spec says keep the catalogue small. Listing them would make this a second sitemap. */
function buildApiCatalog() {
  return JSON.stringify({
    linkset: [
      {
        anchor: SITE,
        describedby: [
          { href: `${SITE}llms.txt`, type: 'text/markdown',
            title: 'Site index for language models' },
        ],
        alternate: [
          { href: `${SITE}feed.xml`, type: 'application/rss+xml', title: 'Star Stuff' },
        ],
        license: [
          { href: 'https://creativecommons.org/licenses/by-sa/4.0/',
            title: 'CC BY-SA 4.0' },
        ],
      },
    ],
  }, null, 2) + '\n';
}

/* ── /.well-known/agent-skills/index.json ─────────────────────────────────────
   Agent Skills discovery (Cloudflare-led RFC, draft v0.2.0): one URL that answers
   "what skills does this site publish for agents?". The SKILL.md itself is
   HAND-WRITTEN — it is prose, and prose belongs in a file somebody can edit — but the
   INDEX is generated, because it carries a sha256 digest of that file and **letting
   the digest drift from the artefact is the first mistake the spec names**. A client
   that verifies the digest and finds a mismatch is entitled to refuse the skill, so a
   hand-kept hash is a hand-kept way to break it. Computed from the bytes on disk, and
   `--check` catches an edited SKILL.md with a stale index.

   `$schema` is not optional: without it a client falls back to v0.1.0 parsing and may
   ignore every entry. */
const SKILL_DIR = '.well-known/agent-skills';
const SKILLS = ['star-stuff'];

function buildAgentSkills() {
  const skills = SKILLS.map((name) => {
    const rel = `${SKILL_DIR}/${name}/SKILL.md`;
    const full = path.join(REPO, rel);
    if (!fs.existsSync(full)) {
      console.error(`\n  ${rel} is named in tools/build-derived.mjs and is not in the repo.`);
      process.exit(1);
    }
    const bytes = fs.readFileSync(full);
    const fm = bytes.toString('utf8').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      console.error(`\n  ${rel} has no YAML frontmatter; the spec requires name and description.`);
      process.exit(1);
    }
    const field = (k) => {
      const m = fm[1].match(new RegExp('^' + k + ':\\s*(.+)$', 'm'));
      return m ? m[1].trim() : null;
    };
    const declared = field('name');
    const description = field('description');
    /* The directory name and the frontmatter name are two statements of the same fact,
       which is this repo's definition of something that will drift. */
    if (declared !== name) {
      console.error(`\n  ${rel} declares name "${declared}" but sits in a directory called "${name}".`);
      process.exit(1);
    }
    if (!description) {
      console.error(`\n  ${rel} has no description. It is the only thing most agents read.`);
      process.exit(1);
    }
    if (description.length > 1024) {
      console.error(`\n  ${rel}'s description is ${description.length} chars; the spec's limit is 1024.`);
      process.exit(1);
    }
    return {
      name,
      type: 'skill-md',
      description,
      url: `${SITE}${rel}`,
      digest: 'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex'),
    };
  });
  return JSON.stringify({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills,
  }, null, 2) + '\n';
}

/* The expiry is the whole reason this file is generated here. Checked on every run,
   not only under --check, so a plain build says it too. */
const expiryDays = Math.floor((Date.parse(SECURITY_EXPIRES) - Date.now()) / 86400000);

/* ── write or check ──────────────────────────────────────────────────────── */
const outputs = [
  ['whats-new.html', buildHtml()],
  ['feed.xml', buildFeed()],
  ['llms.txt', buildLlms()],
  ['.well-known/security.txt', buildSecurityTxt()],
  ['site.webmanifest', buildManifest()],
  ['.well-known/api-catalog', buildApiCatalog()],
  ['.well-known/agent-skills/index.json', buildAgentSkills()],
];

let stale = 0;
for (const [name, next] of outputs) {
  const full = path.join(REPO, name);
  const prev = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  const same = prev === next;
  if (CHECK) {
    console.log(`  ${name.padEnd(26)} ${same ? 'ok' : 'STALE'}`);
    if (!same) stale++;
  } else {
    if (!same) fs.writeFileSync(full, next, 'utf8');
    console.log(`  ${name.padEnd(26)} ${same ? 'unchanged' : 'written'}  ${next.length.toLocaleString()} chars`);
  }
}

console.log(`\n  ${records.length} pieces · ${days.length} days · ${collections.length - 1} collections`
  + ` · newest ${records[0].day} · oldest ${records[records.length - 1].day}`);
console.log(`  ${FEED_ITEMS} most recent in the feed`);
console.log(`  ${eggsSkipped} Easter Eggs excluded by decision (a listed egg is not off the path)`);
console.log(`  ${Object.keys(DATE_OVERRIDES).length} date override${Object.keys(DATE_OVERRIDES).length === 1 ? '' : 's'}`);
console.log(`  security.txt expires ${SECURITY_EXPIRES.slice(0, 10)} — ${expiryDays} day${expiryDays === 1 ? '' : 's'} left`);
console.log(`  feed declares ${SY_FREQUENCY}× ${SY_PERIOD}; theme ${THEME_COLOUR}`
  + ` (${themeRanked[0][1]} of ${themeRanked.reduce((n, [, c]) => n + c, 0)} pages`
  + `${themeRanked.length > 1 ? `, ${themeRanked.length - 1} other value(s)` : ''})`);
if (expiryDays <= SECURITY_RENEW_WITHIN_DAYS) {
  console.error(
    `\n  security.txt ${expiryDays < 0 ? 'EXPIRED' : 'EXPIRES SOON'} — RFC 9116 requires a future Expires, and a`
    + `\n  lapsed file is invalid rather than merely stale. Bump SECURITY_EXPIRES in`
    + `\n  ${path.relative(REPO, fileURLToPath(import.meta.url))} and re-run.`
  );
  process.exitCode = 1;
}

if (CHECK && stale) {
  console.log(`\n  ${stale} file(s) stale — run: node tools/build-derived.mjs`);
  process.exit(1);
}
