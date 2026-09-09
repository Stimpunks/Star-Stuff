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
 * `'unsafe-hashes'` and why it is here
 * ------------------------------------
 * 233 inline event-handler attributes across the site — `onclick="changePage(1)"`
 * and five others — and an event handler cannot be covered by an ordinary hash.
 * `'unsafe-hashes'` plus a hash per distinct handler body covers all 233 with six
 * hashes. It is weaker than a plain hash and far stronger than `'unsafe-inline'`.
 * THE BETTER END STATE is to delete the attributes: every pager button is
 * `id="prev-btn"` / `id="next-btn"` already, so `starstuff.js` could bind them and
 * `'unsafe-hashes'` would go. That is a 233-attribute change across ~150 pages and
 * it is not this pass.
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

    /* Event handlers. The browser hashes the attribute VALUE as source text, after
       HTML entity decoding — none of ours contain an entity, and if one ever does
       this needs a decode step or the hash silently will not match. */
    for (const m of src.matchAll(/\son([a-z]+)="([^"]*)"/g)) {
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
  `script-src 'self' 'unsafe-hashes' ${[...scriptHashes, ...handlerHashes].join(' ')} 'unsafe-inline'`,
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
note(`  ${handlerHashes.length} distinct inline event handlers hashed (${[...inv.handlers.values()].reduce((a, b) => a + b.count, 0)} attributes), covered by 'unsafe-hashes':`);
for (const [, r] of [...inv.handlers.entries()].sort((a, b) => b[1].count - a[1].count)) {
  note(`      x${String(r.count).padEnd(4)} ${r.sample}`);
}
note(`  ${inv.jsonLd} non-executable <script> blocks skipped (JSON-LD — script-src does not apply)`);
note(`  ${inv.styleElems} inline <style> elements and ${inv.styleAttrs} style="…" attributes — why style-src keeps 'unsafe-inline'`);
note(`  policy length: ${policy.length} bytes`);
