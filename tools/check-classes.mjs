#!/usr/bin/env node
/**
 * check-classes.mjs — finds class attributes that style nothing.
 *
 * WHY THIS EXISTS
 * On 2026-08-26, while adding a sixth refusal to No. 67, the closing sentence was
 * written as <span class="pink">…</span> to pick up the house pink. It never
 * rendered. `.pink` is declared as `.body-text .pink`, and `.refusals` is a
 * SIBLING of `.body-text`, not a descendant — so the rule could not match and the
 * span inherited its parent colour instead.
 *
 * ALL SIX EXISTING GATES PASSED IT, and none of them was wrong to. The markup is
 * well formed, so check-markup.mjs is content. The text is legible — in fact
 * check-contrast.mjs passed it *because* it failed: unstyled text inherits a
 * colour that already clears AA, so the fault produced no measurable symptom at
 * all. check-overlap.mjs sees a text box in a sensible place. The search index
 * read the words, because the words were there. check-sheets.mjs and
 * check-sitemap.mjs do not apply. An inert class is invisible to every one of
 * them by construction: it is not a colour, not a tag tree, not a position, not a
 * word, not a page count, not a URL. It is an intention that silently did not
 * happen, and until this file nothing in the repo looked for one.
 *
 * It is not a one-off, either — it is a shape this codebase invites. The house
 * habit is to scope utility classes under a parent (`.body-text .pink`,
 * `.lyss-playlist .lp-section`, `.lp-listen .lp-sectionnote`), which is good CSS
 * and means every such class is one wrong ancestor away from doing nothing.
 * starstuff.css already carries a comment about `.lp-listen` needing its section
 * rules restated for exactly this reason, and CLAUDE.md records `.ss-cobrand`
 * being silently beaten by a page rule at lower specificity. A comment is a note.
 * It is not a control.
 *
 * ── WHAT IT REPORTS, in two kinds ────────────────────────────────────────────
 *   unknown   no rule anywhere in the page's CSS mentions this class at all.
 *             A typo (`card-taglin`), a class left behind after its rule was
 *             deleted, or a name copied from another page that does not load the
 *             sheet defining it.
 *   inert     rules mentioning the class exist, but not one of them matches THIS
 *             element. The `.pink` case: right name, wrong ancestor. This is the
 *             one worth having a gate for, because the class looks correct in
 *             source and correct in the stylesheet, and is wrong only in the
 *             relationship between them.
 *
 * ── WHY IT NEEDS A BROWSER ───────────────────────────────────────────────────
 * `unknown` is answerable from source. `inert` is not, and `inert` is the fault
 * that prompted this. Deciding whether `.body-text .pink` matches a given span
 * requires that span's full ancestor chain, which is a DOM, plus the real
 * cascade — including rules inside @media blocks that a source scan would have to
 * re-implement a CSS parser to find. So the page is loaded, every stylesheet is
 * read through document.styleSheets, and every class use is tested with
 * Element.matches(). That is the browser's own selector engine answering the
 * question, rather than an approximation of it.
 *
 * It is the one gate here that CANNOT read file:// URLs, and that is a property
 * of what it asks rather than an oversight. Its five browser-using siblings read
 * computed styles, text and geometry, all of which Chrome will hand over for a
 * file:// document. This one needs .cssRules — the rules themselves — and a
 * file:// page treats its own linked stylesheet as cross-origin and throws
 * SecurityError there. --allow-file-access-from-files does not lift it. So the
 * repo's own tools/serve.mjs is spawned on a private port and the pages are read
 * over http://127.0.0.1, which makes sheet and document same-origin.
 *
 * A sheet that still cannot be read is reported as UNREAD rather than skipped: a
 * page whose stylesheet failed to open would otherwise report every class as
 * `unknown`, which is a flood, or — if the flood were suppressed — as clean,
 * which is worse. The first run of this file did exactly that, and said so.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ─────────────────────────────────────────
 *   · It does not check the reverse direction (a CSS rule matching no element).
 *     Dead CSS costs bytes; a dead class attribute costs the reader the thing the
 *     author meant to say. Only one of those is a defect in the artifact.
 *   · It does not judge specificity. A class whose rule matches but is overridden
 *     is a different fault, and the honest way to catch it is the contrast and
 *     render checks that already exist.
 *   · It does not reveal spreads or open entries, unlike its two browser
 *     siblings. Matching is structural, not visual, so hidden elements answer
 *     correctly as they are — and revealing would inject `.active`/`.open`
 *     classes this tool would then have to explain away.
 *
 * HOOKS. Some classes are addressed by JavaScript or by the tools in this
 * directory rather than by CSS, and are legitimately unstyled. They are listed
 * explicitly in HOOKS below, are COUNTED and reported in their own line, and are
 * deliberately a short hand-written list rather than a rule like "ignore anything
 * matching js-*" — an exemption should be a decision somebody wrote down, not a
 * mechanism to fall into. check-contrast.mjs settled that argument first.
 *
 * USAGE
 *   node tools/check-classes.mjs                    # every *.html in the repo root
 *   node tools/check-classes.mjs dolly-zine.html    # just these
 *   node tools/check-classes.mjs --check            # exit non-zero on any finding
 *   node tools/check-classes.mjs --verbose          # every finding, not the first 8
 *
 * --check is the gating mode, matching its six siblings. A plain run always exits
 * 0 so an informational sweep does not read as a crash. Local dev tool; Netlify
 * does not run it. Chrome and Node 22+.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9415; // 9411 search-index, 9412 contrast, 9413 sheets, 9414 overlap
const HTTP_PORT = 8776; // its own, so a running preview server on 8765 is never disturbed
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');

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

/* Classes addressed by script or by the tools in this directory rather than by a
   stylesheet. Each one is here because something reads it, and the comment says
   what — so that a future reader can delete an entry when its reader goes away,
   instead of inheriting a list nobody dares touch. */
const HOOKS = new Set([
  // starstuff.js and each zine's own changePage() key on these.
  'spread', 'spread-footer', 'spread-footer-left', 'spread-footer-right',
  // build-search-index.mjs chunk selectors and CHROME_SEL strips.
  'card', 'card-wrap', 'entry', 'scale', 'lp-card', 'lp-row',
  /* Structural repeating-unit marker on the racks, like .lp-card. Its only rule
     is `.lyss-playlist > .lp-head:first-child .lp-section`, so the class is
     targeted on the first section and carried on the rest for consistency.
     Present on every rack, not just the newest — verified 2026-08-26. */
  'lp-head',
  // check-markup.mjs derives collection membership from these.
  'ss-nav-collection', 'ss-nav-collection-label', 'ss-nav-collection-name',
  /* The reading chain is walked by class name — by check-markup.mjs, by the
     one-liner in CLAUDE.md, and by hand at ship time. Neither is styled: the
     arrows take their appearance from `.ss-nav-links a`. Verified 2026-08-26,
     both absent from starstuff.css and starstuff.js. */
  'ss-nav-prev', 'ss-nav-next',
  /* starstuff.js injects the per-spread footer buttons as
     `class="spread-nav-btn prev"` / `"spread-nav-btn next"`. `.spread-nav-btn`
     carries the styling; `.next` adds one colour rule and `.prev` none, so `.prev`
     is inert by construction. It is script-authored markup rather than anything a
     page wrote, which is why it is exempt here rather than deleted. */
  'prev', 'next',
]);

const COLLECT = String.raw`((cfg) => {
  const HOOKS = new Set(cfg.hooks);

  /* ── 1. every selector the page's CSS actually contains ────────────────────
     Recurses grouping rules, because a rule that only exists inside @media print
     still styles the element — a print-only class is not an unstyled one, and a
     scan that missed @media would report the entire print block as dead. */
  const selectors = [];
  let blocked = 0;   // same-origin sheet we should have been able to read — fatal
  let foreign = 0;   // genuinely cross-origin (Google Fonts) — expected, and carries
                     // only @font-face, so it has no class selectors to contribute
  const walk = (rules) => {
    for (const r of rules) {
      if (r.selectorText) selectors.push(r.selectorText);
      if (r.cssRules && !(r.type === 7 /* KEYFRAMES */)) {
        try { walk(r.cssRules); } catch { blocked++; }
      }
    }
  };
  const sameOrigin = (href) => {
    if (!href) return true;                       // inline <style>
    try { return new URL(href, location.href).origin === location.origin; }
    catch { return false; }
  };
  for (const sheet of document.styleSheets) {
    let rules = null;
    try { rules = sheet.cssRules; }
    catch { sameOrigin(sheet.href) ? blocked++ : foreign++; continue; }
    if (!rules) { sameOrigin(sheet.href) ? blocked++ : foreign++; continue; }
    walk(rules);
  }
  /* Only a sheet we OWN failing to open is fatal. Treating the webfont sheet as
     fatal would make every page UNREAD; treating a blocked local sheet as fine
     would report every class on the page as "unknown". */
  if (blocked) return JSON.stringify({ fatal: blocked + ' same-origin stylesheet(s) unreadable' });

  /* ── 2. split on top-level commas, strip state ─────────────────────────────
     Element.matches() answers about the document as it sits, so :hover, :focus
     and :link are false for every element and would make every hover-only class
     look inert. Structural pseudos (:not, :is, :nth-child, :root) are matchable
     and are kept. Pseudo-ELEMENTS are stripped outright: ::before never matches
     an element, and a class used only to hang a ::before on is still doing work. */
  const STATE = /::?(?:hover|focus|focus-visible|focus-within|active|visited|link|target|target-within|disabled|enabled|checked|indeterminate|default|valid|invalid|in-range|out-of-range|required|optional|read-only|read-write|placeholder-shown|autofill|user-invalid|user-valid|open|modal|fullscreen|picture-in-picture|popover-open)\b/g;
  const PSEUDO_EL = /::[-a-zA-Z]+(\([^)]*\))?/g;

  const splitTop = (s) => {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of s) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
  };

  /* ── 2b. cut each selector at the compound that carries the class ──────────
     A class is NOT inert merely because its own element fails to match the whole
     selector. ".masthead-toc-collections a" styles the anchors INSIDE the ul; the
     ul matches nothing itself, and the class is still doing all the work. The
     first draft of this file flagged exactly that, twice, on the front page.

     So for a class in compound i of a complex selector, the question is whether
     the element matches the PREFIX ending at compound i — i.e. "is this element
     serving as the thing that selector names in that position", whether that is
     the subject or an ancestor. Splitting is by top-level combinator, so
     combinators inside :is()/:not()/[attr] are left alone. */
  const COMBINATOR = /^\s*([>+~]|\s)\s*$/;
  const compounds = (sel) => {
    const parts = [];
    let depth = 0, cur = '';
    for (let i = 0; i < sel.length; i++) {
      const ch = sel[i];
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (depth === 0 && (ch === '>' || ch === '+' || ch === '~')) {
        parts.push(cur, ch); cur = ''; continue;
      }
      if (depth === 0 && /\s/.test(ch)) {
        if (cur.trim()) { parts.push(cur, ' '); cur = ''; }
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts;
  };

  /* class -> prefixes it is responsible for. Each prefix is a selector the element
     carrying the class should match if the class is pulling its weight. */
  const byClass = new Map();
  const CLASS_RE = /\.(-?[_a-zA-Z][\w-]*)/g;
  let undecidable = 0;

  for (const group of selectors) {
    for (const raw of splitTop(group)) {
      const matchable = raw.replace(PSEUDO_EL, '').replace(STATE, '').trim();
      if (!matchable) continue;
      const parts = compounds(matchable);
      for (let i = 0; i < parts.length; i++) {
        if (COMBINATOR.test(parts[i])) continue;
        const names = new Set();
        let m;
        CLASS_RE.lastIndex = 0;
        while ((m = CLASS_RE.exec(parts[i]))) names.add(m[1]);
        if (!names.size) continue;
        const prefix = parts.slice(0, i + 1).join('').trim();
        if (!prefix) continue;
        for (const n of names) {
          if (!byClass.has(n)) byClass.set(n, []);
          byClass.get(n).push(prefix);
        }
      }
    }
  }

  /* ── 3. every class use in the document ───────────────────────────────────── */
  const findings = [];
  let uses = 0, hooked = 0;
  const distinct = new Set();
  const seen = new Set(); // one finding per (class, tag, nearest id) — not per element

  const where = (el) => {
    const s = el.closest && el.closest('[id]');
    return (s && s.id) || 'page';
  };
  const sel = (el) => {
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    return (el.tagName || '').toLowerCase() + (c.length ? '.' + c.join('.') : '');
  };

  for (const el of document.querySelectorAll('[class]')) {
    const raw = el.getAttribute('class') || '';
    /* SVGAnimatedString on SVG elements: className is not a string there, which is
       why the attribute is read directly rather than el.classList — classList is
       fine on both, but the attribute is what the author wrote. */
    for (const name of raw.trim().split(/\s+/).filter(Boolean)) {
      uses++;
      distinct.add(name);
      if (HOOKS.has(name)) { hooked++; continue; }

      const cands = byClass.get(name);
      let kind = null;
      if (!cands) {
        kind = 'unknown';
      } else {
        let matched = false;
        for (const s of cands) {
          try { if (el.matches(s)) { matched = true; break; } }
          catch { matched = true; undecidable++; break; } // unsupported selector: do not accuse
        }
        if (!matched) kind = 'inert';
      }
      if (!kind) continue;

      const key = kind + '|' + name + '|' + (el.tagName || '') + '|' + where(el);
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        kind, name,
        rules: cands ? cands.length : 0,
        at: where(el),
        sel: sel(el).slice(0, 70),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46),
      });
    }
  }

  return JSON.stringify({
    uses, hooked, distinct: distinct.size, selectors: selectors.length, undecidable,
    foreign, findings,
  });
})`;

/* ─── minimal CDP client — same shape as check-overlap.mjs ─────────────────── */
async function withPage(fileUrl, fn) {
  const t = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  try {
    return await fn(send);
  } finally {
    try { ws.close(); } catch {}
    await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
  }
}

function evaluated(msg, what) {
  const r = msg && msg.result;
  if (!r || r.exceptionDetails) {
    throw new Error(`${what} threw in-page: ${JSON.stringify(r && r.exceptionDetails).slice(0, 600)}`);
  }
  if (!r.result || r.result.value === undefined) {
    throw new Error(`${what} returned no value: ${JSON.stringify(msg).slice(0, 600)}`);
  }
  return JSON.parse(r.result.value);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Wait on a condition, never a clock — the house rule. Stylesheets must be parsed
   before document.styleSheets is meaningful, and a client-rendered field guide has
   no class attributes to check until it has rendered them. */
async function settle(send) {
  let last = -1;
  for (let i = 0; i < 100; i++) {
    const p = evaluated(
      await send('Runtime.evaluate', {
        expression:
          'JSON.stringify({r:document.readyState,n:document.querySelectorAll("[class]").length,s:document.styleSheets.length})',
        returnByValue: true,
      }),
      'readiness probe'
    );
    if (p.r === 'complete' && p.n === last && p.s > 0) return p.n;
    last = p.n;
    await sleep(150);
  }
  return null;
}

function resolveTargets() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!args.length) return fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
  return args.map((a) => {
    if (fs.existsSync(path.resolve(a))) return path.relative(ROOT, path.resolve(a));
    if (fs.existsSync(path.join(ROOT, path.basename(a)))) return path.basename(a);
    console.error(`No such file: ${a}`);
    process.exit(1);
  });
}

async function main() {
  const files = resolveTargets();

  /* See the header: .cssRules is unreadable on file://, so the pages are served.
     Its own port, so this can run alongside a preview server on 8765. */
  const server = spawn('node', [path.join(ROOT, 'tools', 'serve.mjs'), String(HTTP_PORT)], {
    cwd: ROOT, stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${HTTP_PORT}/`); break; } catch { await sleep(100); }
  }

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-classes-'), 'profile')}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); }
  }

  const results = [];
  /* Kept apart from the findings, never folded into them — a page that read no
     stylesheet reports zero problems, which in a 134-line list is indistinguishable
     from a clean page. check-contrast.mjs learned this one first. */
  const unread = [];

  try {
    for (const f of files) {
      let out;
      try {
        out = await withPage(`http://127.0.0.1:${HTTP_PORT}/${f}`, async (send) => {
          await send('Page.enable');
          const settled = await settle(send);
          const m = evaluated(
            await send('Runtime.evaluate', {
              expression: `(${COLLECT})(${JSON.stringify({ hooks: [...HOOKS] })})`,
              returnByValue: true,
            }),
            'class collect'
          );
          return { ...m, settled };
        });
      } catch (e) {
        unread.push([f, String(e.message || e).slice(0, 140)]);
        console.log(`  ${f.padEnd(44)} UNREAD  ${String(e.message || e).slice(0, 60)}`);
        continue;
      }

      if (out.fatal) {
        unread.push([f, out.fatal]);
        console.log(`  ${f.padEnd(44)} UNREAD  ${out.fatal}`);
        continue;
      }

      let notMeasured = true;
      if (out.settled === null) unread.push([f, 'never settled — DOM still changing after 15s']);
      else if (out.selectors === 0) unread.push([f, 'no CSS rules readable at all']);
      else if (out.uses === 0) unread.push([f, 'no class attributes found']);
      else notMeasured = false;

      results.push([f, out]);

      const n = out.findings.length;
      console.log(
        `  ${f.padEnd(44)} ${notMeasured ? 'UNREAD' : n ? 'FAIL  ' : 'ok    '}` +
          `  ${String(out.uses).padStart(5)} class uses` +
          `  ${String(out.distinct).padStart(4)} distinct` +
          (n ? `  ${n} dead` : '')
      );
      for (const d of out.findings.slice(0, VERBOSE ? 999 : 8)) {
        console.log(
          `      ${d.kind.padEnd(8)} .${d.name.padEnd(24)} on <${d.sel}> in #${d.at}\n` +
            `        ${d.kind === 'unknown'
              ? 'no rule anywhere mentions this class'
              : `${d.rules} rule(s) mention it, none match here`}` +
            (d.text ? `  · "${d.text}"` : '')
        );
      }
      if (!VERBOSE && out.findings.length > 8) console.log(`      … ${out.findings.length - 8} more`);
    }
  } finally {
    chrome.kill();
    server.kill();
  }

  const dead = results.reduce((a, [, o]) => a + o.findings.length, 0);
  const uses = results.reduce((a, [, o]) => a + o.uses, 0);
  const hooked = results.reduce((a, [, o]) => a + o.hooked, 0);
  const undecidable = results.reduce((a, [, o]) => a + o.undecidable, 0);
  const inert = results.reduce((a, [, o]) => a + o.findings.filter((d) => d.kind === 'inert').length, 0);

  console.log(
    `\n${results.length} page(s) · ${uses.toLocaleString()} class uses · ` +
      `${dead} dead (${inert} inert, ${dead - inert} unknown)`
  );
  if (hooked) {
    console.log(
      `${hooked.toLocaleString()} use(s) of ${HOOKS.size} script/tooling hook(s) exempt — these are read by ` +
        `starstuff.js\nand by the tools in this directory, not by a stylesheet.`
    );
  }
  if (undecidable) {
    console.log(`${undecidable} selector(s) the engine could not evaluate — counted as matching, never as dead.`);
  }

  if (unread.length) {
    console.error(`\n${unread.length} page(s) WERE NOT MEASURED. Nothing above counts for these:`);
    for (const [f, why] of unread) console.error(`  ${f.padEnd(44)} ${why}`);
  }

  if (CHECK) {
    if (unread.length) {
      console.error(`\nFAIL — ${unread.length} page(s) not measured; the run is incomplete.`);
      process.exit(1);
    }
    if (dead) {
      console.error(
        `\nFAIL — ${dead} class attribute(s) that style nothing. Fix the selector, move the\n` +
          'element, or delete the class — but do not leave an intention that did not happen.'
      );
      process.exit(1);
    }
    console.log('\nPASS — every class attribute is matched by a rule that reaches its element.');
    process.exit(0);
  }
  if (dead) console.log(`\n${dead} problem(s). Run with --check to make this gate a ship.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
