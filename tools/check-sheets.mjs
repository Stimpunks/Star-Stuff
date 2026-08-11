#!/usr/bin/env node
/**
 * check-sheets.mjs — does a print-first sheet actually fit the paper?
 *
 * WHY THIS EXISTS
 * The broadsides are the only artifacts here designed to be printed and handed
 * to someone, and for a year both of them lied about what they were. Each said
 * "two-sided single sheet" in its own copy. Measured on 2026-08-11:
 *
 *     ls-broadside.html    3 sheet sides on US Letter, 2 on A4
 *     six-ways-broadside   4 sheet sides on both
 *
 * The L★S sheet was a different physical object depending on the reader's
 * country, and nothing in the repo could see it. `check-contrast.mjs` measures
 * whether ink is legible, not whether it landed on the page. The search index
 * measures words. Neither knows what a sheet of paper is.
 *
 * WHAT IT CHECKS, and why each one is here rather than assumed
 *
 * 1. SIDE COUNT ON BOTH PAPERS. Prints to PDF at US Letter (216×279mm) and A4
 *    (210×297mm) and counts pages, expecting one printed side per `.sheet`.
 *    A4 is 6mm narrower and 18mm taller than Letter, so a sheet can pass in one
 *    country and spill in the other — which is exactly what was happening.
 *
 * 2. OVERFLOW, MEASURED SEPARATELY. Page count alone is NOT sufficient, and
 *    this is the subtle one. A `.sheet` with a fixed height whose content
 *    overruns it does not paginate — the overflow is silently CLIPPED at the
 *    page edge. Side B of the Six Ways sheet reported a clean "2 sides" while
 *    its last lines were being cut off the bottom. So content height is
 *    compared against the box height too.
 *
 * 3. MEASURED AT THE REAL PAGE WIDTH, not at a desktop viewport. Print media
 *    queries resolve against the *page box* — roughly 726–748px at these
 *    margins — not against the screen. A `max-width: 820px` mobile breakpoint
 *    was therefore matching on paper, and the sheet printed as one 190mm column
 *    at ~95 characters a line instead of the two-column card that was designed.
 *    Measuring at 1280px showed a layout no printer ever produces.
 *
 * USAGE
 *     node tools/check-sheets.mjs                      # every paper-first sheet
 *     node tools/check-sheets.mjs ls-broadside.html    # just these
 *     node tools/check-sheets.mjs --check              # non-zero exit on failure
 *
 * `--check` is the gating mode, matching build-search-index.mjs and
 * check-contrast.mjs. A plain run always exits 0 so an informational pass does
 * not read as a crash.
 *
 * Targets are auto-detected: any root .html declaring an `@page` rule is a
 * paper-first sheet. Requires Google Chrome and Node 22+ (global WebSocket).
 * Netlify does not run this; it is a local dev tool, same as its siblings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9411;

/* A4 is the narrower paper, Letter the shorter one. A sheet has to clear both. */
const PAPERS = {
  Letter: { paperWidth: 8.5, paperHeight: 11 },
  A4: { paperWidth: 8.27, paperHeight: 11.69 },
};

/* Narrowest real page content box: A4 (210mm) less the 9mm margins the sheets
   declare = 192mm = 726px at 96dpi. Measuring wider tests a phantom layout. */
const PAGE_WIDTH_PX = 726;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));

if (!CHROME) {
  console.error('No Chrome/Chromium found. Install Google Chrome, or edit the CHROME list.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const gating = args.includes('--check');
const named = args.filter((a) => !a.startsWith('--'));

const targets = named.length
  ? named
  : fs
      .readdirSync(REPO)
      .filter((f) => f.endsWith('.html'))
      .filter((f) => /@page\s*\{/.test(fs.readFileSync(path.join(REPO, f), 'utf8')))
      .sort();

if (!targets.length) {
  console.log('No paper-first sheets found (looked for an @page rule in root *.html).');
  process.exit(0);
}

/* Count physical pages in a PDF. /Type /Page but not /Type /Pages. */
const countPages = (b64) => {
  const buf = Buffer.from(b64, 'base64').toString('latin1');
  return (buf.match(/\/Type\s*\/Page[^s]/g) || []).length;
};

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-sheets-'), 'profile')}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

for (let i = 0; i < 60; i++) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/version`);
    break;
  } catch {
    await sleep(250);
  }
}

const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
const ws = new WebSocket(webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let msgId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const id = ++msgId;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = (await send('Target.createTarget', { url: 'about:blank' })).result;
const { sessionId } = (await send('Target.attachToTarget', { targetId, flatten: true })).result;
const S = (m, p) => send(m, p, sessionId);
await S('Page.enable');
await S('Runtime.enable');

let failures = 0;
let sheetsChecked = 0;

for (const file of targets) {
  const abs = path.join(REPO, file);
  if (!fs.existsSync(abs)) {
    console.error(`  ${file.padEnd(34)} MISSING`);
    failures++;
    continue;
  }

  await S('Page.navigate', { url: 'file://' + abs });
  await sleep(1800);

  await S('Emulation.setDeviceMetricsOverride', {
    width: PAGE_WIDTH_PX,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await S('Emulation.setEmulatedMedia', { media: 'print' });
  await sleep(450);

  const sides = JSON.parse(
    (
      await S('Runtime.evaluate', {
        expression: `(() => {
          const out = [];
          document.querySelectorAll('.sheet').forEach((s) => {
            const box = Math.round(s.getBoundingClientRect().height);
            out.push({ id: s.id || s.className, box, content: s.scrollHeight });
          });
          return JSON.stringify(out);
        })()`,
        returnByValue: true,
      })
    ).result.result.value
  );

  await S('Emulation.setEmulatedMedia', { media: '' });
  await S('Emulation.clearDeviceMetricsOverride');

  const expected = sides.length;
  const problems = [];

  /* 2px of tolerance: sub-pixel layout rounding, not a real overrun. */
  for (const s of sides) {
    const over = s.content - s.box;
    if (over > 2) problems.push(`${s.id} overflows its page box by ${over}px (would be clipped, not paginated)`);
  }

  const counts = {};
  for (const [name, paper] of Object.entries(PAPERS)) {
    const { data } = (
      await S('Page.printToPDF', { ...paper, printBackground: false, preferCSSPageSize: true })
    ).result;
    counts[name] = countPages(data);
    if (counts[name] !== expected) {
      problems.push(`${name}: ${counts[name]} printed side(s), expected ${expected}`);
    }
  }

  sheetsChecked += expected;
  const status = problems.length ? 'FAIL' : 'ok  ';
  console.log(
    `  ${file.padEnd(34)} ${status}  ${expected} side(s)   Letter ${counts.Letter}   A4 ${counts.A4}`
  );
  for (const p of problems) console.log(`      ${p}`);
  failures += problems.length;
}

console.log(
  `\n${targets.length} sheet page(s) · ${sheetsChecked} printed side(s) · ${failures} problem(s)`
);

if (failures) {
  console.log(
    gating
      ? '\nFAIL — a sheet does not fit its paper. Trim the content or the type; do not\n' +
          'ship a "single sheet" that prints as three.'
      : '\nRun with --check to make this gate a ship.'
  );
} else {
  console.log('PASS — every sheet is one printed side per side, on A4 and on US Letter.');
}

ws.close();
chrome.kill();
process.exit(gating && failures ? 1 : 0);
