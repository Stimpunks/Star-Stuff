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
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'changelog.html');
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

/* ---- read the archive ---------------------------------------------------- */
const months = fs.readdirSync(REPO).filter((f) => ARCHIVE.test(f)).sort().reverse(); // newest first
if (!months.length) { console.error('No changelog-YYYY-MM.html archive pages found.'); process.exit(1); }

const data = months.map((file) => {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const [, y, m] = file.match(ARCHIVE);
  const entries = [];
  const re = /<section class="release" id="([^"]+)"[\s\S]*?<div class="release-date">([\s\S]*?)<\/div>[\s\S]*?<h2 class="release-title"[^>]*>([\s\S]*?)<\/h2>/g;
  let x;
  while ((x = re.exec(src))) {
    entries.push({ id: x[1], date: decode(strip(x[2])), title: decode(strip(x[3])) });
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

if (checking) {
  const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (have === html) {
    console.log(`changelog.html is up to date — ${data.length} months, ${totalEntries} entries, ${totalItems} items.`);
    process.exit(0);
  }
  console.log('STALE  changelog.html — run: node tools/build-changelog.mjs');
  process.exit(1);
}

fs.writeFileSync(OUT, html);
console.log(`wrote changelog.html — ${data.length} months, ${totalEntries} entries, ${totalItems} items`);
for (const d of data) console.log(`  ${d.file.padEnd(26)} ${String(d.entries.length).padStart(3)} entries`);
