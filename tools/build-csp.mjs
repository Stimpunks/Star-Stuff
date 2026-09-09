#!/usr/bin/env node
/**
 * build-csp.mjs — generate the Content-Security-Policy and write it into `_headers`.
 *
 * Why this exists as a generator rather than a line somebody types
 * ---------------------------------------------------------------
 * The policy the specification recommends is nonce-based, and a nonce has to be
 * unique per response and appear in both the header and the HTML. Netlify serves
 * this repository as static files with no build step and no templating, so there
 * is nowhere for a per-response value to come from. The documented alternative is
 * hashes — and hashes are a list that has to match the site exactly.
 *
 * That is the whole reason this is a tool. A hand-written hash list is wrong the
 * first time somebody ships a zine, and the failure is not cosmetic: an inline
 * script whose hash is missing does not run, so a new zine's pager is dead. So the
 * hashes are computed from the pages, and `--check` fails when the policy in
 * `_headers` no longer matches what the pages need. It belongs in the ship routine
 * beside the other `--check` gates.
 *
 * Why `script-src` has no bare `'unsafe-inline'` doing any work
 * -------------------------------------------------------------
 * `privacy.html` says, in public, that a policy whose `script-src` is
 * `'unsafe-inline'` is "a policy in name only". That has to stay true of this file.
 * Under CSP Level 3 a source list containing a nonce OR A HASH makes a browser
 * IGNORE `'unsafe-inline'` entirely — so it is listed last purely as a fallback for
 * browsers too old to understand hashes, exactly as the specification describes the
 * pattern for nonces. Anything that understands the hash list uses the hash list.
 * VERIFY THIS RATHER THAN TRUSTING IT: the check is whether an injected inline
 * <script> is refused in a current browser. If it runs, the policy is theatre and
 * `'unsafe-inline'` must come out, at the cost of inline handlers on Safari < 15.4.
 *
 * `'unsafe-hashes'` is GONE, and the tool decides that, not a constant
 * ---------------------------------------------------------------------
 * There were 233 inline event-handler attributes — `onclick="changePage(1)"` and
 * five others — and an event handler cannot be covered by an ordinary hash, so the
 * first version of this policy carried `'unsafe-hashes'` to permit six strings
 * across the whole site. All 233 were removed on 2026-09-09 and bound in JavaScript
 * instead: the 100 zine pagers in `starstuff.js` (`bindOwnPager`), and the ten print
 * sheets, `shorthand-evolution.html` and `search.html` in their own inline scripts,
 * each of which already sits after its buttons in the document.
 *
 * The keyword is emitted only while handlers exist, so it dropped out by itself and
 * would come back by itself if one were reintroduced — better than a flag somebody
 * has to remember. The inventory prints the count either way.
 *
 * `style-src` keeps `'unsafe-inline'` and that one is real
 * -------------------------------------------------------
 * 2,290 inline `style="…"` ATTRIBUTES, on all 198 pages — the nav accents, the card
 * colours, every twinkle position. Attributes cannot be hashed without
 * `'unsafe-hashes'` and 2,290 hashes. So `style-src` genuinely permits inline CSS,
 * and that is a real exposure rather than a technicality: CSS injection can deface
 * and can exfiltrate some data through selectors. It cannot execute script. Stated
 * rather than glossed, because the alternative is pretending.
 *
 * Usage
 *   node tools/build-csp.mjs            # write the policy into _headers
 *   node tools/build-csp.mjs --check    # exit non-zero if _headers is out of date
 *   node tools/build-csp.mjs --print    # print ONLY the policy, on one line, write nothing
 *
 * --print is machine-consumable and must stay that way: it is what a local server reads
 * to mirror the production header. It printed the inventory too on the first version, so
 * the value carried newlines and Node refused it as an invalid header — the throwaway
 * server crashed on its first request and the test suite then ran happily against Chrome's
 * error page and reported nine failures that were all mine. The inventory goes to stderr.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const PRINT = process.argv.includes('--print');

const BEGIN = '  # >>> BEGIN GENERATED CSP — tools/build-csp.mjs, do not hand-edit <<<';
const END = '  # >>> END GENERATED CSP <<<';

const sha256 = (s) => `'sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}'`;

/* A <script> is executable — and therefore covered by script-src — when it has no
   `src` and its type is absent or a JavaScript MIME type. `application/ld+json` is a
   data block: browsers do not execute it and do not apply script-src to it, which is
   why the 198 JSON-LD blobs here are not in the hash list. Confirmed by loading the
   site under the policy and watching for a violation rather than by reading the spec. */
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

/* Yield `on…="…"` attributes that are genuinely inside a start tag. Quote-aware and
   skipping <script>, <style> and comments, so prose that merely quotes an attribute is
   not mistaken for one. Deliberately the same shape as check-markup.mjs's tag walk. */
function* handlerAttrs(src) {
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) return;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e === -1 ? src.length : e + 3; continue; }
    if (src.startsWith('<!', lt) || src.startsWith('<?', lt)) { const e = src.indexOf('>', lt); i = e === -1 ? src.length : e + 1; continue; }
    let j = lt + 1, q = null;
    while (j < src.length) {
      const c = src[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
      j++;
    }
    if (j >= src.length) return;
    const raw = src.slice(lt + 1, j);
    const name = (raw.replace(/^\//, '').match(/^[A-Za-z][A-Za-z0-9-]*/) || [''])[0].toLowerCase();
    for (const m of raw.matchAll(/\son([a-z]+)="([^"]*)"/g)) yield m;
    /* Skip raw-text bodies wholesale — this is what stops a handler-shaped string in
       page JavaScript being counted. */
    if (name === 'script' || name === 'style') {
      if (!raw.startsWith('/') && !raw.trimEnd().endsWith('/')) {
        const close = src.toLowerCase().indexOf(`</${name}`, j);
        if (close !== -1) { i = close; continue; }
      }
    }
    i = j + 1;
  }
}

function inventory() {
  const scripts = new Map();      // hash → count
  const handlers = new Map();     // hash → { count, sample }
  let styleAttrs = 0;
  let styleElems = 0;
  let jsonLd = 0;
  const pages = fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).sort();

  for (const f of pages) {
    const src = fs.readFileSync(path.join(REPO, f), 'utf8');

    for (const m of src.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const attrs = m[1];
      const body = m[2];
      if (/\bsrc=/.test(attrs)) continue;
      const t = (attrs.match(/\btype="([^"]*)"/) || ['', ''])[1].trim().toLowerCase();
      if (!JS_TYPES.has(t)) { jsonLd++; continue; }
      if (!body.trim()) continue;
      const h = sha256(body);
      scripts.set(h, (scripts.get(h) || 0) + 1);
    }

    for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      if (m[1].trim()) styleElems++;
    }

    /* Event handlers, found by walking TAGS rather than by scanning the source.
       Scanning found one inside a JS comment — the words onsubmit="return false" in
       a note explaining why that attribute had been removed — and reported it as a
       live handler, which would have kept 'unsafe-hashes' in the policy forever on
       the strength of a sentence. Same fault check-markup.mjs hit the same day, for
       the same reason, and the same fix.

       The browser hashes the attribute VALUE as source text, after HTML entity
       decoding — none of ours contain an entity, and if one ever does this needs a
       decode step or the hash silently will not match. */
    for (const m of handlerAttrs(src)) {
      const body = m[2];
      if (/&[a-zA-Z#]/.test(body)) {
        console.error(`  WARN  ${f}: on${m[1]} contains an HTML entity — its hash will not match. Rewrite it without one.`);
        process.exitCode = 1;
      }
      const h = sha256(body);
      const rec = handlers.get(h) || { count: 0, sample: `on${m[1]}="${body}"` };
      rec.count++;
      handlers.set(h, rec);
    }

    styleAttrs += (src.match(/\sstyle="/g) || []).length;
  }
  return { scripts, handlers, styleAttrs, styleElems, jsonLd, pages: pages.length };
}

const note = (...a) => console.error(...a);

const inv = inventory();

/* Sorted so the header is deterministic — an unsorted list would make --check
   report STALE on a run that changed nothing, which is the fault CLAUDE.md records
   for the feed's lastBuildDate. */
const scriptHashes = [...inv.scripts.keys()].sort();
const handlerHashes = [...inv.handlers.keys()].sort();

const policy = [
  "default-src 'self'",
  /* No <base> anywhere, and nothing may inject one: base-tag injection rewrites every
     relative URL on the page, and this site is built entirely from relative URLs. */
  "base-uri 'none'",
  "object-src 'none'",
  /* Nothing on this site submits a form. The search is onsubmit="return false" and
     matches in the browser. So 'none' is the truth, and it closes the simplest
     exfiltration route an injection would otherwise have. */
  "form-action 'none'",
  "frame-ancestors 'self' https://stimpunks.org https://morerealms.com",
  'frame-src https://www.youtube-nocookie.com https://open.spotify.com',
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  /* 'unsafe-hashes' appears only while inline event handlers exist to cover. All 233
     were removed on 2026-09-09 and bound in JavaScript instead, so the keyword drops
     out on its own — and comes back on its own if a handler is ever reintroduced,
     which is better than a constant somebody has to remember to flip. */
  `script-src 'self'${handlerHashes.length ? " 'unsafe-hashes'" : ''} ${[...scriptHashes, ...handlerHashes].join(' ')} 'unsafe-inline'`,
  'upgrade-insecure-requests',
].join('; ');

const block = [
  BEGIN,
  `  Content-Security-Policy: ${policy}`,
  END,
].join('\n');

const headersPath = path.join(REPO, '_headers');
const current = fs.readFileSync(headersPath, 'utf8');

if (PRINT) {
  console.log(policy);
} else if (!current.includes(BEGIN)) {
  console.error(
    `  _headers has no generated region. Add these two lines inside the /* block, in the\n`
    + `  order you want the header to appear, then re-run:\n\n${BEGIN}\n${END}\n`
  );
  process.exit(1);
} else {
  const re = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const next = current.replace(re, block);
  const same = next === current;
  if (CHECK) {
    note(`  _headers  ${same ? 'ok' : 'STALE'}`);
  } else {
    if (!same) fs.writeFileSync(headersPath, next, 'utf8');
    note(`  _headers  ${same ? 'unchanged' : 'written'}`);
  }
  if (CHECK && !same) {
    console.error(
      '\n  The CSP in _headers no longer matches the pages. An inline script whose hash is\n'
      + '  missing does not run — on a zine that means the pager is dead. Run:\n'
      + '      node tools/build-csp.mjs\n'
      + '  and commit _headers with the change.'
    );
    process.exitCode = 1;
  }
}

note(`\n  ${inv.pages} pages scanned`);
note(`  ${scriptHashes.length} distinct inline <script> bodies hashed (${[...inv.scripts.values()].reduce((a, b) => a + b, 0)} elements)`);
const nHandlers = [...inv.handlers.values()].reduce((a, b) => a + b.count, 0);
note(nHandlers
  ? `  ${handlerHashes.length} distinct inline event handlers hashed (${nHandlers} attributes) — 'unsafe-hashes' IS IN THE POLICY to cover them:`
  : `  0 inline event handlers on the site, so 'unsafe-hashes' is not in the policy. If this`
    + ` ever goes above zero, the keyword returns and script-src weakens for every page.`);
for (const [, r] of [...inv.handlers.entries()].sort((a, b) => b[1].count - a[1].count)) {
  note(`      x${String(r.count).padEnd(4)} ${r.sample}`);
}
note(`  ${inv.jsonLd} non-executable <script> blocks skipped (JSON-LD — script-src does not apply)`);
note(`  ${inv.styleElems} inline <style> elements and ${inv.styleAttrs} style="…" attributes — why style-src keeps 'unsafe-inline'`);
note(`  policy length: ${policy.length} bytes`);
