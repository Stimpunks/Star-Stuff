#!/usr/bin/env node
/**
 * check-sitemap.mjs — does the sitemap still describe the site?
 *
 * WHY THIS EXISTS
 * `sitemap.xml` is hand-maintained, and until now nothing verified it. The four
 * other gates each look at a page: markup structure, contrast in both media,
 * sheet fitting, and the search index. None of them opens the sitemap, so a
 * page could be entirely absent from it and every check would still pass — and
 * a missing entry is invisible to the eye too, because nothing on the live site
 * looks wrong.
 *
 * On 2026-08-12, adding three collection pages meant auditing the file on the
 * way past, which turned up two faults that had been sitting there:
 *
 *   - `the-nearest-body-zine.html` had **never been listed**. A live Star Stuff
 *     zine, linked from the index, sitting in the reading chain, and absent from
 *     the sitemap since it shipped on 20 July — three weeks uncrawlable by
 *     anything following it.
 *   - `six-ways-broadside.html` was listed **twice**, once beside its parent
 *     essay and once in the Print block.
 *
 * Neither was found by a check. Both were found by a person happening to look.
 * That is the argument for this file: the audit already existed as three lines
 * of throwaway Node pasted into a shell, and a check that has to be retyped from
 * memory is a check nobody runs.
 *
 * WHAT IT CHECKS — one question, asked several ways
 * Every check here is a form of *does the sitemap agree with the filesystem?*
 *
 * 1. MISSING — an `.html` file in the repo root with no entry. This is the fault
 *    above, and the most damaging: the page exists, works, and is linked, but
 *    anything crawling the sitemap never learns it is there.
 *
 * 2. STALE — an entry whose file no longer exists. The mirror image: a crawler
 *    is sent to a 404 the site itself never links.
 *
 * 3. DUPLICATE — the same URL listed more than once. Harmless to a crawler, but
 *    it means the file is being edited without being read, which is exactly the
 *    condition the other faults grow in.
 *
 * 4. OFF-SITE OR NON-HTTPS `loc` — anything not under `https://starstuff.earth/`.
 *    A typo here silently points a crawler at another origin.
 *
 * 5. MALFORMED STRUCTURE — unbalanced `<url>` tags, a missing `<urlset>`, or a
 *    `<url>` block with no `<loc>`. An XML parse error makes the *whole* file
 *    useless rather than one entry, so it is worth catching cheaply.
 *
 * 6. THE ROOT ENTRY — `https://starstuff.earth/` must be present, because
 *    `index.html` is deliberately not listed under its own filename and relies on
 *    the bare origin entry for coverage. If the root entry ever goes, the front
 *    page silently drops out of the sitemap and the "missing" check above would
 *    not catch it, since index.html is exempt by design.
 *
 * 7. LASTMOD SANITY — present, `YYYY-MM-DD`, a real date, and not in the future.
 *    A future date is an unambiguous typo (a mistyped month ships a page dated
 *    next year), and crawlers do act on lastmod.
 *
 * WHAT IT DELIBERATELY DOES NOT CHECK
 * - **`lastmod` freshness against git.** Tempting, and wrong. A repo-wide chrome
 *   change — the collection-badge pass touched 66 pages without altering a word
 *   of any of them — would make every one of those `lastmod` values "stale" by a
 *   git comparison, and bumping them would tell crawlers to re-fetch 66 pages
 *   that did not meaningfully change. A check whose first run emits 66 warnings
 *   nobody should act on is a check that gets ignored, and then so are its real
 *   findings. Whether an edit deserves a new `lastmod` is an editorial judgement,
 *   so it stays with the person making the edit.
 * - **`priority` and `changefreq`.** Google has said publicly it ignores both.
 *   Gating on values nothing consumes would be theatre.
 * - **Whether the URLs resolve over the network.** Local dev tool; no network.
 *
 * The bar for adding an eighth check is the same as the one in check-markup.mjs:
 * it has to be a discrepancy between what the sitemap claims and what the site
 * actually is, and it has to be invisible to a person reading the file.
 *
 * USAGE
 *     node tools/check-sitemap.mjs                # audit sitemap.xml
 *     node tools/check-sitemap.mjs --check        # non-zero exit on failure
 *     node tools/check-sitemap.mjs path/to.xml    # audit a different file
 *
 * `--check` is the gating mode, matching build-search-index.mjs, check-contrast.mjs,
 * check-sheets.mjs and check-markup.mjs. A plain run always exits 0 so an
 * informational pass does not read as a crash. It prints every count it measured,
 * not just the failures — same lesson as the search-index coverage percentage and
 * the contrast element counts: when the only output is "it worked", a run that
 * checked nothing looks exactly like a clean one.
 *
 * No Chrome and no dependencies, like check-markup.mjs. Netlify does not run it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://starstuff.earth/';

/* index.html is exempt from the "missing" check by design — it is covered by the
   bare origin entry rather than listed under its own filename. Check 6 guards
   that entry's existence so the exemption cannot quietly become a hole. */
const EXEMPT = new Set(['index.html']);

const args = process.argv.slice(2);
const gating = args.includes('--check');
const named = args.filter((a) => !a.startsWith('--'));
const sitemapPath = path.resolve(REPO, named[0] || 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.error(`No sitemap at ${path.relative(REPO, sitemapPath)}`);
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');
const files = fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).sort();

const problems = [];
const fail = (kind, detail) => problems.push({ kind, detail });

/* ── Structure ─────────────────────────────────────────────────────────────── */
const opens = (xml.match(/<url>/g) || []).length;
const closes = (xml.match(/<\/url>/g) || []).length;
if (!/<urlset[\s>]/.test(xml)) fail('structure', 'no <urlset> element');
if (opens !== closes) fail('structure', `unbalanced <url> tags — ${opens} open, ${closes} close`);

/* Parse per <url> block so a block missing its <loc> is detectable, which a
   global /<loc>/ scan would silently skip over. */
const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
const entries = [];
blocks.forEach((b, i) => {
  const loc = b.match(/<loc>\s*([^<]*?)\s*<\/loc>/);
  if (!loc) { fail('structure', `<url> block ${i + 1} has no <loc>`); return; }
  const lastmod = b.match(/<lastmod>\s*([^<]*?)\s*<\/lastmod>/);
  entries.push({ loc: loc[1], lastmod: lastmod ? lastmod[1] : null });
});

/* ── Coverage ──────────────────────────────────────────────────────────────── */
const locs = entries.map((e) => e.loc);
const paths = [];          // repo-relative page names, root entry excluded
let rootEntry = false;

for (const loc of locs) {
  if (loc === ORIGIN || loc === ORIGIN.slice(0, -1)) { rootEntry = true; continue; }
  if (!loc.startsWith(ORIGIN)) { fail('off-site', loc); continue; }
  paths.push(loc.slice(ORIGIN.length));
}

if (!rootEntry) fail('root', `no bare ${ORIGIN} entry — index.html depends on it for coverage`);

for (const f of files) {
  if (EXEMPT.has(f)) continue;
  if (!paths.includes(f)) fail('missing', f);
}
for (const p of paths) {
  if (!fs.existsSync(path.join(REPO, p))) fail('stale', p);
}
const seen = new Set();
for (const p of paths) {
  if (seen.has(p)) fail('duplicate', p);
  seen.add(p);
}

/* ── lastmod sanity ────────────────────────────────────────────────────────── */
const today = new Date().toISOString().slice(0, 10);
const dates = [];
for (const e of entries) {
  if (e.loc === ORIGIN || e.loc === ORIGIN.slice(0, -1)) continue;
  const name = e.loc.startsWith(ORIGIN) ? e.loc.slice(ORIGIN.length) : e.loc;
  if (!e.lastmod) { fail('lastmod', `${name} — no <lastmod>`); continue; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod)) { fail('lastmod', `${name} — "${e.lastmod}" is not YYYY-MM-DD`); continue; }
  // Round-trip through Date to reject real-looking impossibilities like 2026-02-31.
  const d = new Date(e.lastmod + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== e.lastmod) {
    fail('lastmod', `${name} — "${e.lastmod}" is not a real date`);
    continue;
  }
  if (e.lastmod > today) fail('lastmod', `${name} — dated ${e.lastmod}, which is in the future`);
  dates.push(e.lastmod);
}
dates.sort();

/* ── Report ────────────────────────────────────────────────────────────────── */
const by = (kind) => problems.filter((p) => p.kind === kind);
const line = (label, value) => console.log(`  ${label.padEnd(38)} ${value}`);

console.log(`\n  ${path.relative(REPO, sitemapPath)}\n`);
line('entries', String(entries.length));
line('.html files in repo root', `${files.length}  (index.html covered by the root entry)`);
line('root entry', rootEntry ? 'present' : 'MISSING');
line('lastmod range', dates.length ? `${dates[0]} … ${dates[dates.length - 1]}` : '—');
console.log('');
for (const [kind, label] of [
  ['missing', 'missing from sitemap'],
  ['stale', 'stale (no file on disk)'],
  ['duplicate', 'duplicate entries'],
  ['off-site', 'off-site or non-https locs'],
  ['lastmod', 'lastmod problems'],
  ['structure', 'structural problems'],
  ['root', 'root-entry problems'],
]) {
  const hits = by(kind);
  line(label, hits.length ? `${hits.length}` : 'none');
  for (const h of hits) console.log(`      ${h.detail}`);
}

console.log(
  `\n${files.length} file(s) · ${entries.length} entry(s) · ${problems.length} problem(s)`
);

if (problems.length) {
  console.log(
    gating
      ? `\nFAIL — the sitemap does not describe the site. A missing entry is the costly one:\n` +
          'the page works, is linked, and is invisible to anything crawling the sitemap,\n' +
          'which is how a live zine went three weeks unlisted without any gate noticing.'
      : '\nRun with --check to make this gate a ship.'
  );
} else {
  console.log('PASS — every page listed once, every entry resolves, dates sane.');
}

process.exit(gating && problems.length ? 1 : 0);
