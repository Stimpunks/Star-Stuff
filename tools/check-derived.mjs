#!/usr/bin/env node
/**
 * check-derived.mjs — is every derived file on this site current?
 *
 * WHY ONE GATE INSTEAD OF FOUR FLAGS
 * ----------------------------------
 * Four generators write files that are copies of something else: the listings and
 * feed, the Markdown siblings, the CSP hash list, the search index. Every one of
 * them is only true until somebody edits a page and does not re-run it, and each
 * grew its own `--check` as it was built. Four commands in the ship routine is four
 * chances to run three of them.
 *
 * Queering-Earth's `check-metadata.mjs` is the better shape and this is modelled on
 * it: one gate asking one question. (That tool was also the thing this repo got
 * publicly wrong on 2026-09-09 — see `changelog.html`. It has always had the check;
 * the comment naming it was what was broken.)
 *
 * WHAT THIS IS: A RUNNER, NOT A REIMPLEMENTATION
 * ----------------------------------------------
 * It executes each generator's own `--check` and aggregates. It does NOT recompute
 * what the outputs should be. That is deliberate: a second implementation of four
 * generators would be four more copies free to drift, which is the exact fault every
 * one of those generators exists to prevent. The per-generator flags therefore stay
 * — they are the implementation, and they are what you want while iterating on one
 * tool. This is the thing the ship routine names.
 *
 * THE VERDICT IS THE EXIT CODE, NEVER A PARSED MESSAGE.
 * On 2026-09-09 this repo found six separate cases of a tool reading prose as if it
 * were state: a broken tag quoted in a script, a comment about a deleted attribute,
 * a changelog entry quoting a template, two verification greps, and one sister
 * project's stale comment read instead of its gate list. Scraping "PASS" out of a
 * generator's output would be the seventh. Each tool's own final lines are echoed
 * verbatim for detail, and its exit status decides.
 *
 * Usage
 *   node tools/check-derived.mjs           # all four
 *   node tools/check-derived.mjs --quick   # skip the search index (the only one needing Chrome)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUICK = process.argv.includes('--quick');

/* Cheap first, so a stale listing is reported in a second rather than after a
   minute of headless Chrome. `chrome` marks the one that needs a browser. */
const GENERATORS = [
  { tool: 'build-derived.mjs', writes: 'whats-new.html, feed.xml, llms.txt, .well-known/security.txt' },
  { tool: 'build-csp.mjs', writes: 'the Content-Security-Policy block in _headers' },
  { tool: 'build-markdown.mjs', writes: '57 Markdown siblings, and the rel=alternate that advertises each one' },
  { tool: 'build-search-index.mjs', writes: 'search-index.json', chrome: true },
];

const results = [];
for (const g of GENERATORS) {
  if (QUICK && g.chrome) {
    results.push({ ...g, skipped: true });
    console.log(`  SKIP  ${g.tool.padEnd(24)} needs Chrome, and --quick was given`);
    continue;
  }
  /* A generator that is not there is not a passing generator, and it is not one that
     "reported a problem" either — node exits 1 on MODULE_NOT_FOUND, which reads as a
     stale file until you look. Say what actually happened. */
  if (!fs.existsSync(path.join(REPO, 'tools', g.tool))) {
    results.push({ ...g, ok: false, ran: false, secs: '0.0', out: '', missing: true });
    console.log(`  ERROR ${g.tool.padEnd(24)}         tool not found — this gate is checking less than it claims`);
    continue;
  }

  const started = Date.now();
  const r = spawnSync('node', [path.join(REPO, 'tools', g.tool), '--check'], {
    cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  /* A generator that could not run at all is a failure, not a pass. `status === null`
     means it was killed or never started; treating that as ok is how a gate reports
     zero problems out of zero files — the fault check-contrast.mjs records as UNREAD. */
  const ok = r.status === 0;
  const ran = r.status !== null && !r.error;
  results.push({ ...g, ok, ran, secs, out: (r.stdout || '') + (r.stderr || ''), err: r.error });
  const verdict = !ran ? 'ERROR' : ok ? 'ok   ' : 'STALE';
  console.log(`  ${verdict} ${g.tool.padEnd(24)} ${String(secs).padStart(5)}s   ${g.writes}`);
}

/* Anything time-sensitive a generator reports is surfaced here, because a summary
   that hides a countdown is a summary somebody trusts instead of reading. The one
   case today is security.txt's Expires, which is a gate that fires on a date rather
   than on an edit — build-derived prints the days remaining on every run. */
for (const r of results) {
  if (!r.out) continue;
  for (const line of r.out.split('\n')) {
    if (/expires .* days? left/i.test(line)) console.log(`\n ${line.trim()}`);
  }
}

const failed = results.filter((r) => !r.skipped && !r.ok);
const skipped = results.filter((r) => r.skipped);

if (failed.length) {
  for (const f of failed) {
    console.error(`\n──── ${f.tool} ${f.missing ? 'IS MISSING' : f.ran ? 'reported a problem' : 'COULD NOT RUN'} ────`);
    if (f.err) console.error(`  ${f.err.message}`);
    console.error(f.out.split('\n').filter(Boolean).slice(-14).map((l) => `  ${l}`).join('\n'));
  }
}

const checked = results.filter((r) => !r.skipped).length;
console.log(`\n  ${checked} of ${GENERATORS.length} generators checked`
  + `${skipped.length ? ` · ${skipped.length} skipped` : ''} · ${failed.length} problem(s)`);

if (failed.length) {
  console.error('\nFAIL — a derived file no longer matches the site. Each of these is a copy of'
    + '\nsomething, and a copy that has stopped agreeing with the thing it copies is worse'
    + '\nthan no copy: the site looks right and the file an agent fetches does not. Re-run'
    + '\nthe generator named above without --check, and commit its output.');
  process.exit(1);
}
if (skipped.length) {
  console.log('\nPASS so far — but --quick skipped the search index, so this run does not'
    + '\nanswer the whole question. Run without --quick before shipping.');
  process.exit(0);
}
console.log('\nPASS — every derived file is what its generator would write today.');
