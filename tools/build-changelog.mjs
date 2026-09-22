#!/usr/bin/env node
/* Build changelog.html — the index over the monthly archive pages.
 * ============================================================================
 * WHY THIS IS GENERATED. The changelog was one page carrying every dated entry
 * since the collection started: on 2026-09-14 that was 1,402 KB raw, 449 KB
 * gzipped, 190,000 words, 145 sections — and growing at about six and a half
 * sections a day, without bound. It was split by month, which is Ryan's own
 * ruling on Glimmer Wire (2026-09-04) applied to the other running log here:
 * a log on one page gets worse every week rather than better.
 *
 * The month pages are the SOURCE. This index is a second description of them —
 * every month, and every entry title inside it — and a second description that
 * is hand-kept is one that drifts the first time somebody adds an entry and
 * edits one of two places. So it is derived, and `--check` is a ship gate via
 * check-derived.mjs.
 *
 * WHAT IS NOT GENERATED: the month pages themselves. A new entry is written into
 * changelog-YYYY-MM.html by hand, the way it always was; this file then follows.
 * A new MONTH means a new archive page — copy the most recent one, empty it, fix
 * its head metadata and its prev/next, and add a sitemap row.
 *
 * Reads the archive pages, never a list kept in here, so there is no third answer
 * free to rot.
 *
 * AND changelog.xml, the changelog's own RSS feed (2026-09-21)
 * ------------------------------------------------------------
 * `feed.xml` answers "what came out"; this one answers "why it changed", which is
 * the same split the two pages already make. They are deliberately separate feeds
 * rather than one: a reader who wants the pieces does not necessarily want 643
 * entries about generator internals, and a reader who wants the corrections should
 * not have to watch a zine feed to find them. Nobody is subscribed to both by
 * accident.
 *
 * It is generated HERE rather than in build-derived.mjs for the reason that file's
 * own header gives about llms.txt: the feed needs the same parse of the same archive
 * pages, and a second parser would be a second answer free to drift. The name of
 * this tool now under-describes it, exactly as build-derived's does; a duplicated
 * parser would under-describe the site, and only one of those gets a reader wrong.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'changelog.html');
const FEED = path.join(REPO, 'changelog.xml');
const SITE = 'https://starstuff.earth/';
const ARCHIVE = /^changelog-(\d{4})-(\d{2})\.html$/;
const MONTH = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const args = process.argv.slice(2);
const checking = args.includes('--check');

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
/* Decode to real characters BEFORE re-escaping. Decoding only the five XML
   entities and then escaping the ampersand turns `&middot;` into a literal
   "&middot;" on the page — which is exactly what the first run of this generator
   printed into every date line, and it is the same fault build-derived.mjs already
   records about `&mdash;` in the feed. Named refs first, then numeric. */
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  middot: '\u00b7', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  times: '\u00d7', rarr: '\u2192', larr: '\u2190', deg: '\u00b0',
  lsaquo: '\u2039', rsaquo: '\u203a', sup2: '\u00b2', frac12: '\u00bd',
  eacute: '\u00e9', egrave: '\u00e8', uuml: '\u00fc', ouml: '\u00f6', auml: '\u00e4',
};
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => (n.toLowerCase() in NAMED ? NAMED[n.toLowerCase()] : m));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* XML needs these three in element content; quotes matter in attributes. */
const xesc = (s) => esc(s).replace(/"/g, '&quot;');

/* An entry's prose keeps <em>, <strong> and <code> in the feed and loses every
   other tag, text intact. Anchors go with them: a changelog note's links are
   mostly relative, the item already links to the entry that holds them, and
   absolutising hrefs here would be a second place that knows the site's URL shape.

   The allowed tags are swapped for sentinels BEFORE decoding, not unescaped after
   escaping, because this log quotes markup constantly — `&lt;code&gt;` appears in
   prose about the CSP, and a round trip through escape/unescape would promote that
   quotation into a live tag. The sentinels are control characters, which cannot
   occur in the source. */
const OPEN = '\u0001';
const CLOSE = '\u0002';
const keepInline = (s) => decode(
  s.replace(/<(\/?)(em|strong|code)\b[^>]*>/gi, (_, sl, t) => `${OPEN}${sl}${t.toLowerCase()}${CLOSE}`)
   .replace(/<[^>]+>/g, ''),
).replace(/\s+/g, ' ').trim()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .split(OPEN).join('<').split(CLOSE).join('>');

/* ---- read the archive ---------------------------------------------------- */
const months = fs.readdirSync(REPO).filter((f) => ARCHIVE.test(f)).sort().reverse(); // newest first
if (!months.length) { console.error('No changelog-YYYY-MM.html archive pages found.'); process.exit(1); }

const data = months.map((file) => {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const [, y, m] = file.match(ARCHIVE);
  const entries = [];
  /* The body is captured too, for the feed: a release's own note and the kind and
     name of each item inside it. Releases do not nest, so the first </section>
     after the title closes this one. */
  const re = /<section class="release" id="([^"]+)"[\s\S]*?<div class="release-date">([\s\S]*?)<\/div>[\s\S]*?<h2 class="release-title"[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g;
  let x;
  while ((x = re.exec(src))) {
    const body = x[4];
    const note = body.match(/<p class="release-note">([\s\S]*?)<\/p>/);
    const items = [...body.matchAll(
      /<div class="entry entry--([a-z]+)">\s*<div class="entry-head"><span class="tag tag--[a-z]+">([^<]*)<\/span><span class="entry-name">([\s\S]*?)<\/span><\/div>/g,
    )].map((m) => ({ kind: m[1], label: decode(strip(m[2])), name: keepInline(m[3]) }));
    /* A release with no item is a parse that slipped, not a release: every one of
       the 150 in the archive carries at least one. Same refusal as the zero-entry
       month below — the UNREAD fault, one level down. */
    if (!items.length) {
      console.error(`${file}#${x[1]} yielded 0 items — refusing to write a feed entry that says nothing.`);
      process.exit(1);
    }
    /* The date a release files under is the one in its own id, which every id in
       the archive carries as its first ten characters (`2026-09-20`, or
       `2026-09-20-slug`). Taking it from the id rather than from the rendered date
       line means the feed and the deep link cannot name different days. */
    if (!/^\d{4}-\d{2}-\d{2}(?:-|$)/.test(x[1])) {
      console.error(`${file}#${x[1]}: a release id must begin with its date.`);
      process.exit(1);
    }
    entries.push({
      id: x[1], day: x[1].slice(0, 10),
      date: decode(strip(x[2])), title: decode(strip(x[3])),
      note: note ? keepInline(note[1]) : '', items,
    });
  }
  /* A month page that parses to zero entries is a broken split, not an empty
     month — the UNREAD fault this repo's tools keep re-learning. */
  if (!entries.length) { console.error(`${file} yielded 0 entries — refusing to write an index that hides them.`); process.exit(1); }
  const tags = {};
  for (const t of src.matchAll(/<div class="entry entry--([a-z]+)"/g)) tags[t[1]] = (tags[t[1]] || 0) + 1;
  return { file, y, m, label: `${MONTH[+m]} ${y}`, entries, tags };
});

const totalEntries = data.reduce((a, d) => a + d.entries.length, 0);
const totalItems = data.reduce((a, d) => a + Object.values(d.tags).reduce((x, y) => x + y, 0), 0);

/* ---- build ---------------------------------------------------------------- */
const desc = `Everything that changed in the Star Stuff collection, month by month — ${totalEntries} dated entries across ${data.length} months: pieces added, pieces substantially revised, and every fact-check and attribution audit, including corrections to our own errors.`;

const toc = [
  '    <!-- TABLE OF CONTENTS -->',
  '    <nav class="ss-toc" style="--toc-accent:#22d3ee;" aria-label="Table of contents">',
  '      <h2>Table of Contents</h2>',
  '      <ul>',
  ...data.map((d) => `        <li><a href="#${d.y}-${d.m}">${d.label}</a></li>`),
  '      </ul>',
  '    </nav>',
].join('\n');

const monthBlocks = data.map((d) => {
  const counts = [
    d.tags.new && `${d.tags.new} added`,
    d.tags.updated && `${d.tags.updated} revised`,
    d.tags.factcheck && `${d.tags.factcheck} fact-check${d.tags.factcheck === 1 ? '' : 's'}`,
    d.tags.site && `${d.tags.site} site`,
  ].filter(Boolean).join(' · ');
  const items = d.entries.map((e) =>
    `        <li><a href="${d.file}#${e.id}"><span class="cl-when">${esc(e.date)}</span> <span class="cl-what">${esc(e.title)}</span></a></li>`
  ).join('\n');
  return `  <section class="cl-month" id="${d.y}-${d.m}" aria-labelledby="h-${d.y}-${d.m}">
    <h2 class="cl-month-title" id="h-${d.y}-${d.m}"><a href="${d.file}">${d.label}</a></h2>
    <p class="cl-month-meta">${d.entries.length} entr${d.entries.length === 1 ? 'y' : 'ies'} &middot; ${counts} &mdash; <a href="${d.file}">read the month &rarr;</a></p>
    <ul class="cl-list">
${items}
    </ul>
  </section>`;
}).join('\n\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0a0a14">
<title>Changelog — Star Stuff — Stimpunks × More Realms</title>
<link rel="canonical" href="https://starstuff.earth/changelog.html">
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<!-- The icon set and the manifest, as every other page carries them. This page had
     them until it became a generated index on 2026-09-14; a GENERATED page reverts
     rather than conflicts, so they belong here and not in changelog.html. -->
<link rel="icon" href="favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="alternate" type="text/markdown" href="https://starstuff.earth/changelog.md">
<link rel="alternate" type="application/rss+xml" title="Star Stuff — Changelog" href="changelog.xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Star Stuff · Stimpunks Foundation × More Realms">
<meta property="og:title" content="Changelog — Star Stuff">
<meta property="og:url" content="https://starstuff.earth/changelog.html">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://starstuff.earth/og-card.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Changelog — Star Stuff">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://starstuff.earth/og-card.jpg">
<link rel="stylesheet" href="starstuff.css">
<style>
  :root {
    --void: var(--sp-void-deep);
    --card: var(--sp-card);
    --cyan: var(--sp-cyan);
    --accent: var(--sp-cyan);
    --star-white: var(--sp-white-soft);
    --stardust: var(--sp-secondary-soft);
    --dim: var(--sp-dim);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--void); color: var(--star-white); font-family: 'Atkinson Hyperlegible Next', sans-serif; font-size: 1rem; line-height: 1.7; min-height: 100vh; }
  .doc-shell { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  .nav-brand { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--dim); margin-bottom: 2rem; }
  .hero { margin-bottom: 2.5rem; }
  .hero-eyebrow { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.36em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.3rem; }
  .hero-title { font-weight: 700; font-size: clamp(2.1rem, 6vw, 3.4rem); line-height: 1.05; letter-spacing: -0.02em; color: var(--star-white); margin-bottom: 1.1rem; }
  .hero-title em { font-style: normal; background: linear-gradient(90deg, var(--sp-purple), var(--sp-pink), var(--sp-gold), var(--sp-cyan), var(--sp-green)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-sub { font-size: 1.02rem; line-height: 1.6; color: var(--stardust); max-width: 38rem; }
  .hero-rule { width: 200px; max-width: 55%; margin-top: 1.6rem; }
  .body-text { font-size: 1.02rem; line-height: 1.75; color: var(--stardust); max-width: 38rem; }
  .body-text p { margin-bottom: 1.1rem; }
  .body-text strong { color: var(--star-white); font-weight: 700; }
  .body-text em { font-style: italic; color: var(--star-white); }
  .body-text a { color: var(--cyan); text-decoration: none; border-bottom: 1px solid currentColor; }
  .callout { background: var(--card); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; padding: 1.2rem 1.4rem; margin: 2rem 0; }
  .callout-label { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem; }
  .callout p { font-size: 0.95rem; line-height: 1.7; color: var(--stardust); }
  .callout p + p { margin-top: 0.7rem; }
  .callout a { color: var(--cyan); }

  /* The subscribe strip, the same component whats-new.html carries and tinted to
     this page's accent rather than that one's. The two pages answer different
     questions and so do their feeds: feed.xml is the pieces, changelog.xml is why
     they changed. */
  .subscribe { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem 1rem; margin: 2rem 0 0.5rem; padding: 1rem 1.15rem; background: var(--card); border: 1px solid rgba(34,211,238,0.28); border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0; }
  .subscribe-label { font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); }
  .subscribe-text { font-size: 0.94rem; line-height: 1.65; color: var(--stardust); flex: 1 1 16rem; min-width: 0; }
  /* This strip sits OUTSIDE .body-text, so the page's own .body-text a rule does
     not reach the cross-link inside it. Without this the browser default won, at
     1.99:1 on the card ground, and check-contrast said so. */
  .subscribe-text a { color: var(--cyan); text-decoration: none; border-bottom: 1px solid currentColor; }
  .subscribe-link { display: inline-block; font-family: 'Space Mono', monospace; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); padding: 0.45rem 1.05rem; border: 1px solid rgba(34,211,238,0.5); border-radius: 999px; text-decoration: none; white-space: nowrap; }
  .subscribe-link:hover, .subscribe-link:focus-visible { background: rgba(34,211,238,0.14); color: var(--star-white); border-color: var(--accent); }

  /* The month index. One block per archive page, each listing that month's own
     entries — generated by tools/build-changelog.mjs from the pages themselves,
     so the list here cannot drift from what the months actually contain. */
  .cl-month { margin: 3rem 0 0; }
  .cl-month-title { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.01em; color: var(--star-white); margin: 0 0 0.35rem; scroll-margin-top: 2rem; }
  .cl-month-title a { color: inherit; text-decoration: none; border-bottom: 2px solid rgba(34,211,238,0.35); }
  .cl-month-title a:hover { border-bottom-color: var(--cyan); }
  .cl-month-meta { font-family: 'Space Mono', monospace; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim); margin-bottom: 1.1rem; }
  .cl-month-meta a { color: var(--cyan); text-decoration: none; }
  .cl-list { list-style: none; margin: 0; padding: 0; border-left: 1px solid rgba(34,211,238,0.18); }
  .cl-list li { margin: 0; }
  .cl-list a { display: block; padding: 0.7rem 0 0.7rem 1rem; color: var(--stardust); text-decoration: none; border-left: 3px solid transparent; margin-left: -1px; }
  .cl-list a:hover { color: var(--star-white); border-left-color: var(--cyan); background: rgba(34,211,238,0.05); }
  .cl-when { display: block; font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); }
  .cl-what { display: block; font-size: 0.95rem; line-height: 1.5; margin-top: 0.15rem; }

  .start-link { display: inline-block; margin-top: 3rem; font-family: 'Space Mono', monospace; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); text-decoration: none; }
  .colophon-footer { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.12em; line-height: 2; color: var(--dim); }
  .colophon-footer a { color: var(--dim); text-decoration: none; }

  @media print {
    .doc-shell { max-width: 100%; padding: 0; }
    .hero-title em { -webkit-text-fill-color: #111; color: #111; background: none; }
    .cl-list { border-left: 1px solid #999; }
  }
</style>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'CollectionPage',
  name: 'Changelog — Star Stuff', description: desc,
  url: 'https://starstuff.earth/changelog.html',
  mainEntityOfPage: 'https://starstuff.earth/changelog.html',
  image: 'https://starstuff.earth/og-card.jpg',
  isPartOf: { '@type': 'WebSite', name: 'Star Stuff', url: 'https://starstuff.earth/' },
  publisher: [
    { '@type': 'Organization', name: 'Stimpunks Foundation', url: 'https://stimpunks.org/', logo: { '@type': 'ImageObject', url: 'https://starstuff.earth/og-card.jpg' } },
    { '@type': 'Organization', name: 'More Realms', url: 'https://morerealms.com/' },
  ],
  hasPart: data.map((d) => ({ '@type': 'WebPage', name: `Changelog · ${d.label}`, url: `https://starstuff.earth/${d.file}` })),
}, null, 0)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

<div class="doc-shell">

  <nav class="ss-nav" style="--nav-accent:#22d3ee;" aria-label="Star Stuff collection">
    <span class="ss-nav-home-group">
      <a class="ss-nav-home" href="index.html"><span class="ss-star" aria-hidden="true">★</span> stuff</a>
      <a class="ss-nav-about" href="about.html">about</a>
      <a class="ss-nav-search" href="search.html">search</a><a class="ss-nav-privacy" href="privacy.html">privacy</a>
    </span>
    <a class="ss-nav-collection" href="collection-notes.html"><span class="ss-nav-collection-label">Collection</span> <span class="ss-nav-collection-name">Notes &amp; Rationale</span> <span class="ss-nav-arrow" aria-hidden="true">&rsaquo;</span></a>
  </nav>
<main id="main" tabindex="-1">

  <div class="nav-brand"><a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · Star Stuff Changelog</div>

  <header class="hero">
    <div class="hero-eyebrow"><a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks Foundation</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · What Changed, and When</div>
    <h1 class="hero-title"><em>Changelog</em></h1>
    <p class="hero-sub">Every piece as it arrived, every substantial revision, and every fact-check — corrections included. These are living documents, and a living document should show its work.</p>
    <hr class="spectrum-line hero-rule">
  </header>

  <div class="subscribe">
    <span class="subscribe-label">Subscribe</span>
    <p class="subscribe-text">Corrections arrive by RSS, separately from the pieces. No account, no email, no tracking &mdash; your reader fetches a file. <a href="whats-new.html">What&rsquo;s New</a> has its own feed for new work.</p>
    <a class="subscribe-link" href="changelog.xml">RSS feed</a>
  </div>

  <div class="body-text">

    <p>This log is backfilled from the collection's full commit history and kept up from here. It records three kinds of change: <strong>pieces added</strong>, <strong>pieces substantially revised</strong>, and <strong>fact-check and attribution audits</strong> — including the errors we found in our own work and exactly how we fixed them. Small typo passes and styling tweaks are left out; anything that changes what a piece <em>claims</em> is in.</p>

    <p><strong>${totalEntries} dated entries across ${data.length} months, one page each.</strong> This was a single page until 14 September 2026, when it had reached 1.4&nbsp;MB and was growing by about six entries a day — the same argument that split <a href="collection-glimmer-wire.html">the Glimmer Wire</a> into one page per edition. <strong>The cost is stated rather than hidden:</strong> you can no longer search the whole history with your browser's find-in-page. <a href="search.html">Site search</a> covers it, every entry keeps the address it always had, and a link to any of them still lands on the right entry.</p>

    <div class="callout">
      <div class="callout-label">Why publish our corrections</div>
      <p>We braid real science with ideas credited to named thinkers, so the facts and the attributions have to be right. We're human, and we've gotten things wrong — a paraphrase dressed as a Sagan quote, a Martin Luther King Jr. line credited to Baldwin, a forest-wide fungal network asserted as settled fact because it rhymed so well with mutual aid. Naming those in public is part of the method, not an embarrassment to bury.</p>
      <p>The working guidelines and the full per-piece ledger live in <a href="https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md">FACTCHECK.md</a>. If you spot an error, <a href="https://github.com/Stimpunks/Star-Stuff/issues">open an issue</a> or reach us at <a href="https://stimpunks.org">stimpunks.org</a>. <strong>Corrections are mutual aid.</strong></p>
    </div>

  </div>

${toc}

${monthBlocks}

  <div class="body-text">
    <a class="start-link" href="index.html">Browse the collection →</a>

    <div class="colophon-footer">
      <a class="ss-cobrand" href="https://stimpunks.org/">Stimpunks Foundation</a> × <a class="ss-cobrand" href="https://morerealms.com/">More Realms</a> · <a href="https://starstuff.earth">starstuff.earth</a> · <a href="https://stimpunks.org">stimpunks.org</a> · <a href="https://morerealms.com">morerealms.com</a> · <a href="https://github.com/Stimpunks/Star-Stuff">Source on GitHub</a><br>
      Print freely · Share freely · <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · L★S · You were ★stuff all along
    </div>
  </div>

</div><!-- /doc-shell --></main>

<script src="starstuff.js"></script>
</body>
</html>
`;

/* ---- changelog.xml -------------------------------------------------------- */

/* The four structural kinds, as <category>. These are the same four words the
   month blocks' counts line uses eighty lines up; the entry LABELS are not used
   here because the archive carries thirty distinct ones ("Held honestly",
   "Refused as evidence", "Declared unread") — informative in the body, useless as
   a filterable vocabulary. The labels are read off the page rather than kept in a
   table for exactly that reason: a table would have had four. */
const KIND = { new: 'Added', updated: 'Revised', factcheck: 'Fact-check', site: 'Site' };

/* A CHANGELOG ENTRY IS DATED TO A DAY AND NOT TO AN INSTANT, so the feed says so:
   midnight UTC, on every entry, on every machine. There is a real publication time
   hiding in git — the commit that added the section — and it was deliberately not
   used. The page's own date line and the id are what a reader sees and what a deep
   link resolves to, and an entry written on the 20th and pushed after midnight
   would then be filed on the 20th by the page and the 21st by the feed. That is the
   fault the 20 September entry in this very archive is about, reintroduced one file
   over.

   The cost is that entries sharing a day share a pubDate, so a reader that sorts
   strictly by date may shuffle them. They are emitted newest first and most readers
   keep feed order; inventing descending seconds to force the order would be
   inventing a time, which is the trade this repo takes the other way every time.

   Rendered from the three integers of the date string, via Date.UTC, which touches
   no timezone at all — never through a local Date. See build-derived.mjs's rfc822
   for the five days that rule cost. */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function rfc822(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) throw new Error(`build-changelog: not a YYYY-MM-DD day: ${JSON.stringify(day)}`);
  const [, y, mo, d] = m;
  const dow = DOW[new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()];
  return `${dow}, ${d} ${MONTH[+mo].slice(0, 3)} ${y} 00:00:00 +0000`;
}
{ /* The same fixed-input guard build-derived.mjs carries, and for the same reason:
     any implementation that reaches for the local clock fails this on every machine
     but one, rather than only where it happens not to match. */
  const WANT = 'Sun, 20 Sep 2026 00:00:00 +0000';
  const got = rfc822('2026-09-20');
  if (got !== WANT) {
    throw new Error(`build-changelog: rfc822 is not machine-independent.\n  wanted ${WANT}\n  got    ${got}`);
  }
}

/* 50 items, as feed.xml carries. September ran 96 entries in 20 days — about five a
   day — so fifty is roughly ten days of headroom and a once-daily poll cannot miss
   one. Re-derive that before changing either number; the all-time rate is 2.3/day
   and would flatter it. */
const FEED_ITEMS = 50;
const SY_PERIOD = 'daily';
const SY_FREQUENCY = 1;

const feedDesc = `Why the Star Stuff collection changed, newest first — pieces added, `
  + `pieces substantially revised, and every fact-check and attribution audit, `
  + `including corrections to our own errors. The companion feed to What's New, `
  + `which carries the pieces themselves.`;

function buildFeed() {
  /* Months are newest first and each month's entries descend within it, so the
     concatenation is already in order; the sort is here so that stays true if a
     month page is ever written the other way up. Array.prototype.sort is stable,
     so entries sharing a day keep the order the page puts them in. */
  const flat = data.flatMap((d) => d.entries.map((e) => ({ ...e, file: d.file })))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));

  const items = flat.slice(0, FEED_ITEMS).map((e) => {
    const url = `${SITE}${e.file}#${e.id}`;
    const cats = [...new Set(e.items.map((i) => KIND[i.kind]).filter(Boolean))];
    const body = `<p><em>${esc(e.date)}</em></p>`
      + (e.note ? `<p>${e.note}</p>` : '')
      + `<ul>${e.items.map((i) => `<li><strong>${esc(i.label)}</strong> — ${i.name}</li>`).join('')}</ul>`;
    return `    <item>
      <title>${xesc(e.title)}</title>
      <link>${xesc(url)}</link>
      <guid isPermaLink="true">${xesc(url)}</guid>
      <pubDate>${rfc822(e.day)}</pubDate>
${cats.map((c) => `      <category>${xesc(c)}</category>`).join('\n')}
      <description>${xesc(body)}</description>
    </item>`;
  }).join('\n');

  /* lastBuildDate is the newest item's date, not the clock — a feed that changed on
     every run would report STALE seconds after a clean write. */
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>Star Stuff — Changelog</title>
    <link>${SITE}changelog.html</link>
    <atom:link href="${SITE}changelog.xml" rel="self" type="application/rss+xml"/>
    <description>${xesc(feedDesc)}</description>
    <language>en</language>
    <copyright>CC BY-SA 4.0 · Stimpunks Foundation × More Realms</copyright>
    <lastBuildDate>${rfc822(flat[0].day)}</lastBuildDate>
    <sy:updatePeriod>${SY_PERIOD}</sy:updatePeriod>
    <sy:updateFrequency>${SY_FREQUENCY}</sy:updateFrequency>
    <image>
      <url>${SITE}og-card.jpg</url>
      <title>Star Stuff — Changelog</title>
      <link>${SITE}changelog.html</link>
    </image>
${items}
  </channel>
</rss>
`;
}

const xml = buildFeed();

if (checking) {
  const stale = [
    [OUT, 'changelog.html', html],
    [FEED, 'changelog.xml', xml],
  ].filter(([f, , want]) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '') !== want);
  if (!stale.length) {
    console.log(`changelog.html and changelog.xml are up to date — ${data.length} months, ${totalEntries} entries, ${totalItems} items.`);
    process.exit(0);
  }
  for (const [, name] of stale) console.log(`STALE  ${name}`);
  console.log('       run: node tools/build-changelog.mjs');
  process.exit(1);
}

fs.writeFileSync(OUT, html);
fs.writeFileSync(FEED, xml);
console.log(`wrote changelog.html — ${data.length} months, ${totalEntries} entries, ${totalItems} items`);
console.log(`wrote changelog.xml  — ${Math.min(totalEntries, FEED_ITEMS)} of ${totalEntries} entries`);
for (const d of data) console.log(`  ${d.file.padEnd(26)} ${String(d.entries.length).padStart(3)} entries`);
