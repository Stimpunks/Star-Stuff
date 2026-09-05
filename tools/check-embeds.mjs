#!/usr/bin/env node
//
// check-embeds.mjs — does every embedded video still play, and play *embedded*?
//
// This is NOT a ninth ship gate, deliberately. Every one of the eight gates answers a
// question about files in this repo: what colour is it, what shape is the tag tree, where
// is it on screen, does it fit the paper, is it in the sitemap, is it findable, did the
// styling happen, is it in the right place in the list. All eight are hermetic — no
// network, no third-party state — and `check-sitemap.mjs` names never touching the network
// as one of its virtues.
//
// This one asks a question about somebody else's server, and the answer can change while
// nobody here touches anything. A red gate you cannot fix by editing the repo is a gate
// people learn to push past, which is how a gate stops being read. So: an on-demand audit,
// run when adding a rack and periodically over the shelf, and promoted to a gate only if
// somebody decides that trade is worth making and writes down why.
//
// WHY IT EXISTS. The Sound collection's rule three says "every embed is resolved before it
// ships" and the mechanism is YouTube's oEmbed endpoint, which returns the real title and
// channel for a video ID. That catches the fault it was built for — a card whose embed
// quietly points at a different recording — and it is blind to this one:
//
//     oEmbed returns HTTP 200, with a correct title and channel, for a video that no
//     longer plays at all.
//
// Measured 2026-09-05 on `wux1Bhmx2Zg` and `sR1CDM4ZfLQ`, both of which oEmbed happily
// described while the player said "Video unavailable". A reader found them; no gate could.
// A sweep of all 269 embeds on the shelf then turned up two more of the same kind on racks
// that had shipped weeks earlier — one dead, one age-restricted, which blocks embedding
// just as effectively.
//
// WHAT IT CHECKS. `playable_in_embed`, via yt-dlp, which is the actual property the reader
// depends on. An age-restricted video is reported: "Sign in to confirm your age" is a broken
// card even though the video exists.
//
// WHAT IT SKIPS, and why that is not a coverage hole: `/embed/videoseries?list=…` is a
// playlist embed, which has no single video ID and which yt-dlp reports as unavailable when
// handed the literal string "videoseries". Treating that as a fault would train the reader
// to ignore one line of output, which is the beginning of ignoring all of them.
//
// Requires yt-dlp on PATH and network. Local dev tool; Netlify does not run it.
//
//   node tools/check-embeds.mjs                       # every *.html in the repo root
//   node tools/check-embeds.mjs bowie-playlist.html   # just these
//   node tools/check-embeds.mjs --check               # exit non-zero on any finding
//
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONCURRENCY = 6;
const TIMEOUT_MS = 60_000;

// A playlist embed has no single video id; see the note above.
const SKIP_IDS = new Set(['videoseries']);

const argv = process.argv.slice(2);
const gating = argv.includes('--check');
const named = argv.filter(a => !a.startsWith('--'));

// `.map(basename)` would pass the array index as basename's `suffix` argument, which
// throws. Named explicitly rather than relying on arity.
const files = (named.length ? named.map(n => basename(n)) : readdirSync(ROOT).filter(f => f.endsWith('.html')))
  .filter(f => existsSync(join(ROOT, f)))
  .sort();

const jobs = [];
const perFile = new Map();
for (const f of files) {
  const html = readFileSync(join(ROOT, f), 'utf8');
  const ids = [...html.matchAll(/youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{3,})/g)].map(m => m[1]);
  const real = ids.filter(id => !SKIP_IDS.has(id));
  if (ids.length) perFile.set(f, { total: ids.length, skipped: ids.length - real.length, bad: [] });
  for (const id of new Set(real)) jobs.push([f, id]);
}

if (!jobs.length) {
  console.log('\n  no video embeds found in the pages given.\n');
  process.exit(0);
}

console.log(`\n  ${jobs.length} distinct embed(s) across ${perFile.size} page(s) — asking YouTube whether each still plays\n`);

const queue = jobs.slice();
let done = 0;

async function worker() {
  for (;;) {
    const job = queue.shift();
    if (!job) return;
    const [file, id] = job;
    let problem = null;
    try {
      const { stdout } = await run(
        'yt-dlp',
        ['--no-warnings', '--skip-download', '--print', '%(playable_in_embed)s|%(age_limit)s|%(channel)s|%(title)s',
         `https://www.youtube.com/watch?v=${id}`],
        { timeout: TIMEOUT_MS },
      );
      const [embeddable, age, channel, ...rest] = stdout.trim().split('|');
      const title = rest.join('|');
      if (embeddable !== 'True') problem = { id, why: 'embedding disabled', channel, title };
      else if (Number(age) > 0) problem = { id, why: `age-restricted (${age}+) — blocks embedded playback`, channel, title };
    } catch (err) {
      const msg = String(err.stderr || err.message || err);
      const line = (msg.match(/ERROR:[^\n]*/) || ['unreachable'])[0]
        .replace(/^ERROR:\s*\[youtube\]\s*[A-Za-z0-9_-]+:\s*/, '')
        .trim()
        .slice(0, 90);
      problem = { id, why: line };
    }
    if (problem) perFile.get(file).bad.push(problem);
    done++;
    if (done % 40 === 0) process.stderr.write(`  …${done}/${jobs.length}\n`);
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

let failures = 0;
let skipped = 0;
for (const [file, info] of perFile) {
  skipped += info.skipped;
  failures += info.bad.length;
  const status = info.bad.length ? `${info.bad.length} DEAD` : 'ok';
  console.log(`  ${file.padEnd(42)} ${status.padEnd(8)} ${String(info.total).padStart(3)} embed(s)`);
  for (const b of info.bad) {
    console.log(`      ${b.id}  ${b.why}${b.title ? `  — ${b.title}` : ''}`);
  }
}

console.log(`\n${perFile.size} page(s) · ${jobs.length} distinct embed(s) checked · ${failures} unplayable`);
if (skipped) console.log(`${skipped} playlist embed(s) (/embed/videoseries?list=…) not checked — no single video id to ask about.`);

if (failures) {
  console.log(`\nFAIL — a card whose embed does not play is invisible to all eight gates, and`);
  console.log(`       oEmbed will still describe it correctly. Replace the id, preferring an`);
  console.log(`       official or institutional channel, and re-run.`);
} else {
  console.log(`\nPASS — every embed still plays, and plays embedded.`);
}

process.exit(gating && failures ? 1 : 0);
