#!/usr/bin/env node
/**
 * check-dead-css.mjs — CSS rules that style nothing.
 *
 * NOT a gate, deliberately, and the reasoning is check-embeds.mjs's. Every one of
 * the nine gates answers a question about a defect a READER meets: a colour, a tag
 * tree, a position, a page count, a URL, a dead class attribute, a card's order,
 * the reader's own palette. Dead CSS is none of those — CLAUDE.md's own line is
 * that "dead CSS costs bytes, a dead class attribute costs the reader the thing
 * the author meant to say, and only one of those is a defect in the artifact."
 * That stays true. This is an on-demand audit, run when tidying.
 *
 * WHY IT EXISTS ANYWAY. On 2026-09-13, No. 54 was found carrying eight .trades
 * rules for a table that had never existed in any commit — and the same dead block
 * also carried a 720px breakpoint, the only one on the site, chosen for that table.
 * The bytes were harmless; the breakpoint was a structural decision nobody could
 * justify, sitting in a file nobody had reason to re-read. That is the case this
 * finds, and it is why the report flags a fully-dead @media block separately.
 *
 * IT IS THE INVERSE OF check-classes.mjs. That one asks "does this class attribute
 * get styled?" and needs the browser's own selector engine. This asks "does this
 * rule style anything?", and querySelectorAll is the WRONG instrument for it: every
 * state selector — .entry.open, .spread.active, :hover, :disabled — matches nothing
 * at rest and is perfectly alive. Reporting those would bury the real findings.
 *
 * So the test is stricter and simpler: a selector is dead when it names a class
 * TOKEN that exists NOWHERE — not in any class attribute in the rendered DOM, not
 * in the page's own inline scripts, and not in starstuff.js. A token absent from
 * all three cannot be produced by any state, which is what makes deleting the rule
 * provably safe: a selector that can never match contributes nothing to any
 * element's computed style, so removing it cannot change a rendering.
 *
 * starstuff.js is read from disk and included. It adds .open, .spread-footer-nav
 * and .spread-nav-btn at runtime, none of which appear in page markup — without it
 * this tool would report live rules as dead on every paged zine.
 *
 * Tokens inside :not() are ignored. :not(.absent) matches everything, so a missing
 * class there is harmless rather than dead.
 *
 * RENDERED, NOT SOURCE. The field guides build their entries from JS object
 * literals, so a source scan would call every entry class dead. Spreads and entries
 * are revealed first, which can only ADD classes and so can only reduce findings.
 *
 * SERVED OVER HTTP, for check-classes.mjs's reason: a file:// page treats its own
 * linked stylesheet as cross-origin and .cssRules throws SecurityError.
 *
 * ONE BUG WORTH KEEPING IN THE HEADER. The first run reported 0 selectors examined
 * across 207 pages and exited clean. Chrome supports CSS nesting, so every
 * CSSStyleRule now carries a (usually empty) .cssRules — and a walk that tested
 * .cssRules before .selectorText recursed into nothing and swallowed every style
 * rule on the site. A property's presence is not a type. Test selectorText first.
 *
 * USAGE
 *   node tools/check-dead-css.mjs                 # every *.html in the repo root
 *   node tools/check-dead-css.mjs index.html      # just these
 *   node tools/check-dead-css.mjs --json          # machine-readable, for a stripper
 *   node tools/check-dead-css.mjs --check         # exit non-zero on any finding
 *
 * Only inline <style> is examined. starstuff.css is shared by 207 pages, so a class
 * unused on one page is live on another; "dead" there is a site-wide question this
 * tool does not ask.
 *
 * Requires Chrome and Node 22+. Local dev tool; Netlify does not run it.
 */
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9464;          // 9411 index, 9412 contrast, 9413 sheets, 9414 overlap
const SERVE_PORT = 8796;
const JSON_OUT = process.argv.includes('--json');
const CHECK = process.argv.includes('--check');
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('No Chrome/Chromium found.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHARED_JS = fs.readFileSync(path.join(ROOT, 'starstuff.js'), 'utf8');

const PROBE = (sharedJs) => String.raw`(() => {
  const SHARED = ${JSON.stringify(sharedJs)};
  for (const s of document.querySelectorAll('.spread:not(.active)')) s.classList.add('active');
  for (const e of document.querySelectorAll('.entry:not(.open)')) e.classList.add('open');
  for (const d of document.querySelectorAll('details:not([open])')) d.open = true;

  const present = new Set();
  for (const el of document.querySelectorAll('*')) {
    const c = el.getAttribute && el.getAttribute('class');
    if (c && typeof c === 'string') for (const t of c.trim().split(/\s+/)) if (t) present.add(t);
  }
  let scriptText = SHARED;
  for (const s of document.querySelectorAll('script')) scriptText += '\n' + (s.textContent || '');

  const findings = []; let selCount = 0;
  const walk = (rules, media) => {
    for (const r of rules) {
      if (r.selectorText) {
        if (r.cssRules && r.cssRules.length) walk(r.cssRules, media);
      } else if (r.cssRules) {
        walk(r.cssRules, r.conditionText !== undefined
          ? (media ? media + ' / ' : '') + '@media ' + r.conditionText : media);
        continue;
      } else continue;
      for (const sel of r.selectorText.split(',')) {
        selCount++;
        const bare = sel.replace(/:not\([^)]*\)/g, '');
        const toks = [...bare.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1]);
        if (!toks.length) continue;
        const missing = toks.filter(t => !present.has(t) && !scriptText.includes(t));
        if (missing.length) findings.push({ sel: sel.trim(), missing, media: media || '' });
      }
    }
  };
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch { continue; }
    if (!rules || sh.href) continue;
    walk(rules, '');
  }
  return JSON.stringify({ findings, selCount });
})()`;

function targets() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!args.length) return fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
  return args.map(a => path.basename(a));
}

const files = targets();
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu',`--remote-debugging-port=${PORT}`,
  `--user-data-dir=${fs.mkdtempSync('/tmp/ss-deadcss-')}/p`,'about:blank'], {stdio:'ignore'});
for (let i=0;i<60;i++){ try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }
const srv = spawn('node',[path.join(ROOT,'tools/serve.mjs'), String(SERVE_PORT)],{cwd:ROOT,stdio:'ignore'});
await sleep(1200);

const report = {}; const unread = [];
let totalSel = 0, totalDead = 0;
try {
  for (const f of files) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`http://127.0.0.1:${SERVE_PORT}/${f}`)}`,{method:'PUT'})).json();
      const ws = new WebSocket(t.webSocketDebuggerUrl); let id=0; const pend=new Map();
      const send=(m,p={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}))});
      ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
      await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
      for(let i=0;i<100;i++){const p=JSON.parse((await send('Runtime.evaluate',{expression:'JSON.stringify(document.readyState)',returnByValue:true})).result.result.value);if(p==='complete')break;await sleep(100)}
      await sleep(120);
      const res = await send('Runtime.evaluate',{expression:PROBE(SHARED_JS),returnByValue:true});
      if (!res.result || res.result.exceptionDetails || !res.result.result || res.result.result.value===undefined)
        throw new Error('probe threw in-page');
      const v = JSON.parse(res.result.result.value);
      totalSel += v.selCount;
      if (v.findings.length) { report[f] = v.findings; totalDead += v.findings.length; }
      try{ws.close()}catch{}
      await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(()=>{});
    } catch(e) { unread.push([f, String(e.message||e).slice(0,80)]); }
  }
} finally { chrome.kill(); srv.kill(); }

if (JSON_OUT) {
  console.log(JSON.stringify({ report, totalSel, totalDead, unread }, null, 1));
} else {
  for (const [f, finds] of Object.entries(report)) {
    console.log(`\n${f}  —  ${finds.length} dead selector(s)`);
    for (const d of finds) console.log(`    ${d.media ? d.media + '  ' : ''}${d.sel}   [missing: ${d.missing.join(', ')}]`);
  }
  console.log(`\n${files.length} page(s) · ${totalSel.toLocaleString()} inline selector(s) examined`);
  console.log(`${totalDead} dead selector(s) across ${Object.keys(report).length} page(s)`);
  /* An unmeasured page is a broken run, not a clean page — check-contrast.mjs's
     lesson, and it gates separately for the same reason. */
  if (unread.length) {
    console.error(`\n${unread.length} page(s) NOT MEASURED. Nothing above counts for these:`);
    for (const [f,w] of unread) console.error(`  ${f.padEnd(44)} ${w}`);
  }
}
if (CHECK) process.exit(unread.length || totalDead ? 1 : 0);
