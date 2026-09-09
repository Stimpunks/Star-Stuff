#!/usr/bin/env node
/**
 * build-markdown.mjs — derive a Markdown sibling for every prose page.
 *
 * WHAT THIS IS, AND THE ONE THING IT IS NOT
 * -----------------------------------------
 * The spec's `markdown-source-endpoints` item asks a site to expose "every
 * documentation page's raw Markdown source". THIS SITE HAS NO MARKDOWN SOURCE.
 * The hand-written HTML is the source, so every `.md` here is a DERIVED SECOND
 * REPRESENTATION — which the same spec page warns about by name: *"letting the
 * Markdown drift from the HTML … the two should be generated from the same source
 * at the same time."* Generated satisfies that. Hand-written never could, so
 * nothing here is typed.
 *
 * Ported from Queering-Earth's `tools/make-markdown.mjs`, which got the hard part
 * right: derive from the page's own `<main>` landmark, and **throw on an element
 * the converter does not know** rather than silently dropping it. A converter that
 * quietly discards an element is how a Markdown copy comes to say less than the
 * page, which is the drift this file exists to prevent arriving by another door.
 *
 * THE GATE HERE IS A `--check` FLAG; THERE IT IS A SEPARATE TOOL. Corrected 2026-09-09,
 * hours after this file first claimed Queering-Earth had no staleness check at all.
 * IT DOES. `make-markdown.mjs` there has no `--check`, and the `check-markdown.mjs` its
 * header named was never written — but the check lives in `check-metadata.mjs`, which
 * regenerates every derived file into memory and compares, and separately asserts that
 * each page still advertises its sibling. Both verified firing. Their header comment was
 * stale; their coverage was not. I read the comment instead of their gate list.
 *
 * Which is the fault this file is otherwise full of examples of — a claim in prose
 * mistaken for the state of the thing. And their shape is arguably the better one: a
 * single gate asking "is every derived file current?" rather than a flag per generator.
 *
 * WHICH PAGES, AND WHY NOT ALL OF THEM
 * ------------------------------------
 * 57 of 198. The other 141 are excluded in two groups, both derived rather than
 * listed, because Markdown would misrepresent them:
 *
 *   - 137 ARTIFACT pages — 101 paged zines, 24 client-rendered field guides, 10
 *     two-sided print sheets, 2 scroll zines. A zine's argument is partly carried
 *     by its figures: the site has 1,021 inline `<svg>` elements holding 4,851 text
 *     labels, almost all of them on these pages. A `.md` of a zine would be its
 *     prose with the diagrams silently absent — a smoothed retelling of our own
 *     work, published in a file whose whole purpose is to be trusted by machines.
 *     The field guides would be worse still: their entries are built from JS object
 *     literals and do not exist in the source at all.
 *   - 4 FURNITURE pages, named explicitly below.
 *
 * WHAT IS DROPPED FROM THE 56, AND DECLARED
 * -----------------------------------------
 * `<svg>` is dropped: on these pages it is the spectrum rule and the cover motifs,
 * decoration rather than argument. But the count goes in the frontmatter as
 * `omitted_diagrams`, because a reader of the Markdown is owed the fact that
 * something was left out — the artifact pages are excluded for exactly this reason
 * and it would be inconsistent to drop silently here.
 *
 * `<iframe>` becomes a LINK rather than being dropped. 275 of them across nine
 * racks are song embeds, and the song's identity is the content; a bare "275
 * omitted" would lose the playlist entirely.
 *
 * Interactive furniture — `<button>`, `<form>`, `<label>`, `<input>`, `<nav>` — is
 * dropped: a Markdown file has nothing to do with a control.
 *
 * Usage
 *   node tools/build-markdown.mjs           # write the .md siblings
 *   node tools/build-markdown.mjs --check   # exit non-zero if any is stale
 *   node tools/build-markdown.mjs about.html   # one page, to stdout
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://starstuff.earth/';
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const ONE = args.find((a) => a.endsWith('.html'));

/* Furniture, excluded by name with a reason each — the bar every exemption list in
   this repo is held to. Not a pattern: these are four decisions. */
const FURNITURE = {
  'index.html': 'a 169-card grid, 395 KB of it, already carried by llms.txt, whats-new.html and the collection pages',
  'whats-new.html': 'itself a generated listing of other pages; a .md would be a third copy of the same taglines',
  'search.html': 'an application, not prose — its content is a form and an index it fetches',
  '404.html': 'an error page, noindex, and nothing an agent should be handed as content',
};

/* ── a small, strict HTML reader ──────────────────────────────────────────────
   Quote-aware, comment-skipping, and it builds a tree rather than a token stream
   so block and inline handling can recurse. Deliberately not a general parser:
   it assumes the well-formed markup that check-markup.mjs already guarantees. */
const VOID = new Set(['br', 'hr', 'img', 'source', 'meta', 'link', 'input', 'col', 'wbr']);

const ENTS = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–',
  hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', middot: '·',
  deg: '°', plusmn: '±', frac12: '½', sup2: '²', micro: 'µ', laquo: '«', raquo: '»',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä',
  aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', szlig: 'ß', aring: 'å',
  oslash: 'ø', ae: 'æ', copy: '©', reg: '®', trade: '™', larr: '←', rarr: '→', uarr: '↑',
  darr: '↓', harr: '↔', lsaquo: '‹', rsaquo: '›', bull: '•', dagger: '†', sect: '§',
  para: '¶', ordm: 'º', sbquo: '‚', bdquo: '„', prime: '′', Prime: '″', minus: '−',
  ne: '≠', le: '≤', ge: '≥', asymp: '≈', infin: '∞', sigma: 'σ', mu: 'μ', alpha: 'α',
  beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ', pi: 'π', omega: 'ω', Omega: 'Ω',
  thinsp: ' ', ensp: ' ', emsp: ' ', shy: '', zwj: '', zwnj: '',
  /* Added after the first run left 27 of these undecoded in the output. Every one
     appears in this site's own prose — Šklovskij and Čapek in the Rainbow Serpents
     references, a square root in the Star Stuff collection, a hair space in a
     colophon. This table is the only thing between a reader and a literal
     "&Scaron;", so a new entity in a new page belongs here. */
  hairsp: '\u200a', radic: '\u221a', Scaron: '\u0160', scaron: '\u0161',
  ccaron: '\u010d', Ccaron: '\u010c', yacute: '\u00fd', Yacute: '\u00dd',
  iuml: '\u00ef', euml: '\u00eb', chi: '\u03c7', theta: '\u03b8', phi: '\u03c6',
  epsilon: '\u03b5', tau: '\u03c4', rho: '\u03c1', kappa: '\u03ba', nu: '\u03bd',
  eta: '\u03b7', zeta: '\u03b6', Delta: '\u0394', Sigma: '\u03a3', Phi: '\u03a6',
  Theta: '\u0398', Lambda: '\u039b', Gamma: '\u0393', Pi: '\u03a0',
};
function decode(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, b) => {
    if (b[0] === '#') {
      const n = b[1] === 'x' || b[1] === 'X' ? parseInt(b.slice(2), 16) : parseInt(b.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return b in ENTS ? ENTS[b] : m;
  });
}

function parse(html, where) {
  const root = { tag: '#root', attrs: {}, kids: [] };
  const stack = [root];
  let i = 0;
  const push = (n) => stack[stack.length - 1].kids.push(n);
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { const t = html.slice(i); if (t) push({ tag: '#text', text: t }); break; }
    if (lt > i) push({ tag: '#text', text: html.slice(i, lt) });
    if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt + 4); i = e === -1 ? html.length : e + 3; continue; }
    if (html.startsWith('<!', lt)) { const e = html.indexOf('>', lt); i = e === -1 ? html.length : e + 1; continue; }
    let j = lt + 1, q = null;
    while (j < html.length) {
      const c = html[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
      j++;
    }
    const raw = html.slice(lt + 1, j);
    const closing = raw.startsWith('/');
    const name = (raw.replace(/^\//, '').match(/^[A-Za-z][A-Za-z0-9-]*/) || [''])[0].toLowerCase();
    if (!name) { i = j + 1; continue; }
    if (closing) {
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === name) { stack.length = k; break; }
      }
      i = j + 1;
      continue;
    }
    const attrs = {};
    for (const m of raw.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) attrs[m[1].toLowerCase()] = decode(m[2]);
    const node = { tag: name, attrs, kids: [] };
    push(node);
    /* Raw-text elements: consume the body verbatim and do not parse inside it. */
    if (name === 'script' || name === 'style') {
      const close = html.toLowerCase().indexOf(`</${name}`, j);
      i = close === -1 ? html.length : close;
      continue;
    }
    if (!VOID.has(name) && !raw.trimEnd().endsWith('/')) stack.push(node);
    i = j + 1;
  }
  return root;
}

/* ── the element vocabulary ───────────────────────────────────────────────────
   Every element these 56 pages use inside <main>, and what becomes of it. An
   element absent from all four tables THROWS. That is the point: a converter that
   shrugs is how the Markdown quietly starts saying less than the page. */
const DROP = new Set(['svg', 'script', 'style', 'button', 'form', 'label', 'input', 'nav', 'source']);
const TRANSPARENT = new Set(['div', 'section', 'article', 'header', 'footer', 'main', 'span', 'picture', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'small', 'abbr', 'mark', 'time', 'u', 'dl']);
const EMPH = { strong: 'strong', b: 'strong', em: 'em', i: 'em', cite: 'em', dfn: 'em', var: 'em', q: 'q', code: 'code', kbd: 'code', samp: 'code', sub: 'sub', sup: 'sup', del: 'del', ins: 'ins' };
const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'hr', 'br',
  'table', 'tr', 'th', 'td', 'caption', 'blockquote', 'figure', 'figcaption', 'details', 'summary',
  'img', 'a', 'iframe', 'dt', 'dd', 'pre']);

const esc = (s) => s.replace(/([\\`*_[\]<>])/g, '\\$1');
const abs = (href) => {
  if (!href) return '';
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
  return SITE + href.replace(/^\.?\//, '');
};

/* Does this subtree contain a block-level element? Decides whether a transparent
   container is a paragraph in its own right. `br` does not count — a line break
   inside a run of text does not make that text two blocks. */
const BLOCKISH = new Set(['p','h1','h2','h3','h4','h5','h6','ul','ol','li','hr','table','tr','th','td','caption','blockquote','figure','figcaption','details','summary','section','article','header','footer','div','dl','dt','dd','pre','main','nav','form']);
function hasBlock(n) {
  for (const k of n.kids || []) {
    if (BLOCKISH.has(k.tag)) return true;
    if (k.kids && hasBlock(k)) return true;
  }
  return false;
}

function convert(node, file) {
  const stats = { svg: 0, iframe: 0 };
  /* Emphasis markers are emitted only on the outermost transition per kind. A
     <cite> inside an <em> otherwise produces four asterisks with no unambiguous
     reading — the fault Queering-Earth's tool records hitting on a citation. */
  const depth = { strong: 0, em: 0, code: 0 };
  /* Inside a code span a backslash is literal, so escaping there PRINTS it —
     `\<div\>` where the page says `<div>`. print-design quotes markup in three
     places and all three were wrong. */
  const escText = (t) => (depth.code ? t : esc(t));

  function inline(n) {
    if (n.tag === '#text') return escText(decode(n.text)).replace(/\s+/g, ' ');
    if (DROP.has(n.tag)) { if (n.tag === 'svg') stats.svg++; return ''; }
    if (n.tag === 'br') return '  \n';
    if (n.tag === 'a') {
      const t = n.kids.map(inline).join('').trim();
      const h = abs(n.attrs.href);
      return t ? (h ? `[${t}](${h})` : t) : '';
    }
    if (n.tag === 'img') {
      const alt = (n.attrs.alt || '').replace(/\s+/g, ' ').trim();
      return `![${esc(alt)}](${abs(n.attrs.src)})`;
    }
    if (n.tag === 'iframe') {
      stats.iframe++;
      const t = (n.attrs.title || 'Embedded player').replace(/\s+/g, ' ').trim();
      return `[▶ ${esc(t)}](${n.attrs.src || ''})`;
    }
    const k = EMPH[n.tag];
    if (k) {
      if (k === 'q') return '“' + n.kids.map(inline).join('') + '”';
      if (k === 'sub') return '~' + n.kids.map(inline).join('') + '~';
      if (k === 'sup') return '^' + n.kids.map(inline).join('') + '^';
      /* del/ins keep their HTML: Markdown has no way to say which half is the
         correction, and on this site that pair is a published erratum. */
      if (k === 'del' || k === 'ins') return `<${k}>` + n.kids.map(inline).join('') + `</${k}>`;
      const mark = k === 'strong' ? '**' : k === 'em' ? '*' : '`';
      const outer = depth[k] === 0;
      depth[k]++;
      const body = n.kids.map(inline).join('');
      depth[k]--;
      if (!body.trim()) return body;
      return outer ? mark + body.trim() + mark + (body.endsWith(' ') ? ' ' : '') : body;
    }
    if (TRANSPARENT.has(n.tag)) return n.kids.map(inline).join('');
    if (BLOCK.has(n.tag)) return n.kids.map(inline).join('');
    throw new Error(`${file}: no rule for <${n.tag}> (inline context). Add it to the vocabulary or to DROP — do not let it fall through.`);
  }

  const out = [];
  const put = (s) => { if (s !== undefined && s !== null) out.push(s); };

  function block(n, listDepth = 0, ordered = false, idx = 0) {
    if (n.tag === '#text') { const t = decode(n.text); if (t.trim()) put(t.replace(/\s+/g, ' ').trim() + '\n\n'); return; }
    if (DROP.has(n.tag)) { if (n.tag === 'svg') stats.svg++; return; }
    switch (n.tag) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const lvl = Number(n.tag[1]);
        const t = n.kids.map(inline).join('').replace(/\s+/g, ' ').trim();
        if (t) put(`${'#'.repeat(lvl)} ${t}\n\n`);
        return;
      }
      case 'p': case 'figcaption': case 'dt': case 'dd': {
        const t = n.kids.map(inline).join('').replace(/[ \t]+/g, ' ').trim();
        if (t) put((n.tag === 'figcaption' ? `*${t}*` : t) + '\n\n');
        return;
      }
      case 'hr': put('---\n\n'); return;
      case 'br': return;
      case 'blockquote': {
        const inner = render(n.kids).trim().split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
        if (inner.trim()) put(inner + '\n\n');
        return;
      }
      case 'ul': case 'ol': {
        let i = 0;
        for (const k of n.kids) {
          if (k.tag !== 'li') { if (k.tag === '#text' && !k.text.trim()) continue; block(k, listDepth, false, 0); continue; }
          i++;
          block(k, listDepth + 1, n.tag === 'ol', i);
        }
        if (listDepth === 0) put('\n');
        return;
      }
      case 'li': {
        const pad = '  '.repeat(Math.max(0, listDepth - 1));
        const bullet = ordered ? `${idx}. ` : '- ';
        /* A nested list inside an <li> is rendered after the item's own text. */
        const own = n.kids.filter((k) => k.tag !== 'ul' && k.tag !== 'ol');
        const nested = n.kids.filter((k) => k.tag === 'ul' || k.tag === 'ol');
        const t = own.map(inline).join('').replace(/[ \t]+/g, ' ').trim();
        put(`${pad}${bullet}${t}\n`);
        for (const nl of nested) block(nl, listDepth, false, 0);
        return;
      }
      case 'details': {
        const sum = n.kids.find((k) => k.tag === 'summary');
        const rest = n.kids.filter((k) => k !== sum);
        if (sum) {
          const t = sum.kids.map(inline).join('').replace(/\s+/g, ' ').trim();
          if (t) put(`**${t}**\n\n`);
        }
        put(render(rest));
        return;
      }
      case 'summary': {
        const t = n.kids.map(inline).join('').replace(/\s+/g, ' ').trim();
        if (t) put(`**${t}**\n\n`);
        return;
      }
      case 'figure': put(render(n.kids)); return;
      case 'table': {
        const cap = n.kids.find((k) => k.tag === 'caption');
        if (cap) {
          const t = cap.kids.map(inline).join('').replace(/\s+/g, ' ').trim();
          if (t) put(`*${t}*\n\n`);
        }
        const rows = [];
        (function walk(x) {
          for (const k of x.kids || []) {
            if (k.tag === 'tr') rows.push(k);
            else if (k.tag === 'thead' || k.tag === 'tbody' || k.tag === 'tfoot') walk(k);
          }
        })(n);
        if (!rows.length) return;
        const cells = (tr) => tr.kids.filter((k) => k.tag === 'th' || k.tag === 'td')
          .map((c) => c.kids.map(inline).join('').replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim());
        const head = cells(rows[0]);
        const isHead = rows[0].kids.some((k) => k.tag === 'th');
        put(`| ${head.join(' | ')} |\n`);
        put(`| ${head.map(() => '---').join(' | ')} |\n`);
        for (const tr of rows.slice(isHead ? 1 : 0)) {
          const c = cells(tr);
          while (c.length < head.length) c.push('');
          put(`| ${c.join(' | ')} |\n`);
        }
        put('\n');
        return;
      }
      case 'a': {
        /* An <a class="card"> wraps six block-level divs — number, title, series,
           tagline, description, footer. Flattening all of that into link text
           produced one 400-character link per card, which is both unreadable and a
           loss of structure: the title, the tagline and the description stop being
           distinguishable. So a card is rendered as a heading that carries the link,
           then its parts as prose.

           This couples the converter to this site's own class names, deliberately.
           It is not a general HTML-to-Markdown converter and the header says so; a
           general one has no way to know which of six divs is the title. */
        if ((n.attrs.class || '').split(/\s+/).includes('card')) {
          const part = (cls) => {
            let found = '';
            (function walk(x) {
              for (const k of x.kids || []) {
                if ((k.attrs?.class || '').split(/\s+/).includes(cls)) { found = k.kids.map(inline).join('').replace(/\s+/g, ' ').trim(); return; }
                walk(k);
              }
            })(n);
            return found;
          };
          const title = part('card-title') || inline(n).trim();
          const href = abs(n.attrs.href);
          put(`### [${title}](${href})\n\n`);
          const meta = [part('card-number'), part('card-series')].filter(Boolean).join(' · ');
          if (meta) put(`${meta}\n\n`);
          for (const cls of ['card-moment', 'card-tagline']) {
            const t = part(cls);
            if (t) put(`*${t}*\n\n`);
          }
          const desc = part('card-desc');
          if (desc) put(`${desc}\n\n`);
          /* .card-footer is a tag chip and an arrow — navigation furniture. */
          return;
        }
        const t = inline(n).trim();
        if (t) put(t + '\n\n');
        return;
      }
      case 'img': case 'iframe': case 'pre': {
        const t = inline(n).trim();
        if (t) put(t + '\n\n');
        return;
      }
      default: {
        if (TRANSPARENT.has(n.tag)) {
          /* If nothing inside is a block, this container IS a paragraph. Recursing
             blindly made every text node its own paragraph, so the co-brand eyebrow
             `<div>Stimpunks × More Realms · About</div>` came out as four blocks
             with the × alone on a line of its own. */
          if (!hasBlock(n)) {
            const t = n.kids.map(inline).join('').replace(/[ \t]+/g, ' ').trim();
            if (t) put(t + '\n\n');
            return;
          }
          put(render(n.kids));
          return;
        }
        if (EMPH[n.tag]) { const t = inline(n).trim(); if (t) put(t + '\n\n'); return; }
        throw new Error(`${file}: no rule for <${n.tag}> (block context). Add it to the vocabulary or to DROP — do not let it fall through.`);
      }
    }
  }

  function render(kids) {
    const saved = out.length;
    for (const k of kids) block(k);
    const piece = out.slice(saved).join('');
    out.length = saved;
    return piece;
  }

  const body = render(node.kids);
  return { body, stats };
}

/* ── page selection, derived rather than listed ───────────────────────────── */
function classify(src) {
  if (src.includes('id="next-btn"')) return 'paged zine';
  if (src.includes('cover-scroll')) return 'scroll zine';
  /* `${entry.` must be looked for INSIDE A SCRIPT, not anywhere in the file. The
     first version scanned the whole source and excluded changelog.html — because a
     changelog entry *quotes* `misreads the ${entry.name}` while explaining a fix to
     it. Prose about a template read as a template, and the site's largest and most
     agent-useful document silently had no Markdown sibling.

     Fifth occurrence of this same fault in one day, in a fifth tool. The rule, now
     written down in CLAUDE.md: ask the structure, never the raw text. The other three
     discriminators here were checked and are safe — each matches only inside a real
     tag — but they are cheap to re-check and expensive to be wrong about. */
  const scripts = [...src.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((m) => !m[1].includes('ld+json'))
    .map((m) => m[2])
    .join('\n');
  if (/\$\{entry\./.test(scripts)) return 'client-rendered field guide';
  if (src.includes('id="btn-print"')) return 'print sheet';
  return null;
}

const lastmod = (() => {
  const map = new Map();
  const sm = fs.readFileSync(path.join(REPO, 'sitemap.xml'), 'utf8');
  for (const m of sm.matchAll(/<loc>https:\/\/starstuff\.earth\/([^<]*)<\/loc><lastmod>([0-9-]+)</g)) {
    map.set(m[1] || 'index.html', m[2]);
  }
  return map;
})();

const meta = (src, name) => {
  const m = src.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`));
  return m ? decode(m[1]) : '';
};

const all = fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).sort();
const pages = [];
const excluded = { furniture: [], artifact: {} };
for (const f of all) {
  if (FURNITURE[f]) { excluded.furniture.push(f); continue; }
  const src = fs.readFileSync(path.join(REPO, f), 'utf8');
  const kind = classify(src);
  if (kind) { (excluded.artifact[kind] ||= []).push(f); continue; }
  pages.push(f);
}

const targets = ONE ? pages.filter((p) => p === ONE) : pages;
if (ONE && !targets.length) {
  console.error(`  ${ONE} is not in the Markdown set. ${FURNITURE[ONE] ? 'Furniture: ' + FURNITURE[ONE] : 'It is an artifact page — see the header comment.'}`);
  process.exit(1);
}

let stale = 0, wrote = 0, totalBytes = 0, totalSvg = 0, totalIframe = 0, missingLink = 0;
for (const f of targets) {
  const src = fs.readFileSync(path.join(REPO, f), 'utf8');
  const mainMatch = src.match(/<main\b[^>]*>([\s\S]*)<\/main>/);
  if (!mainMatch) { console.error(`  ${f}: no <main> landmark — check-markup guarantees one, so this is a real fault`); process.exitCode = 1; continue; }
  const tree = parse(mainMatch[1], f);
  const { body, stats } = convert(tree, f);

  const title = (src.match(/<title>([\s\S]*?)<\/title>/) || ['', f])[1];
  const cleanTitle = decode(title).split('—')[0].trim();
  const badge = src.match(/class="ss-nav-collection-name"[^>]*>([^<]*)</);
  const fm = [
    '---',
    `title: ${JSON.stringify(cleanTitle)}`,
    `url: ${JSON.stringify(SITE + f)}`,
    `updated: ${JSON.stringify(lastmod.get(f) || '')}`,
    `description: ${JSON.stringify(meta(src, 'description'))}`,
    badge ? `collection: ${JSON.stringify(decode(badge[1]).trim())}` : null,
    'licence: "CC-BY-SA-4.0"',
    'licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"',
    'fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"',
    'generated_by: "tools/build-markdown.mjs, from the page\'s own <main> landmark"',
    /* Declare the loss. The artifact pages are excluded from this set precisely
       because Markdown drops their diagrams, so dropping one here without saying
       so would be the same fault at a smaller scale. */
    stats.svg ? `omitted_diagrams: ${stats.svg}  # inline <svg>, decoration on this page — the HTML is the artifact` : null,
  ].filter(Boolean).join('\n') + '\n---\n\n';

  const md = (fm + body).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trimEnd() + '\n';

  /* The file existing is half of it. A page in this set must also ADVERTISE its
     sibling with rel="alternate" in its own <head> — an unadvertised .md is found
     only by an agent that already guessed the URL pattern, which is the failure
     llms.txt v2 exists to fix, in miniature. Nothing else would notice. */
  if (!src.includes(`href="${SITE}${f.replace(/\.html$/, '.md')}"`)) {
    console.error(`  ${f}: no <link rel="alternate" type="text/markdown"> in <head> — the sibling exists but nothing points at it`);
    process.exitCode = 1;
    missingLink++;
  }

  if (ONE) { process.stdout.write(md); continue; }
  const dest = path.join(REPO, f.replace(/\.html$/, '.md'));
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
  const same = prev === md;
  if (CHECK) { if (!same) { stale++; console.error(`  STALE  ${f.replace(/\.html$/, '.md')}`); } }
  else if (!same) { fs.writeFileSync(dest, md, 'utf8'); wrote++; }
  totalBytes += md.length; totalSvg += stats.svg; totalIframe += stats.iframe;
}

if (ONE) process.exit(0);

console.log(`\n  ${targets.length} Markdown siblings · ${(totalBytes / 1024).toFixed(0)} KB · ${CHECK ? `${stale} stale` : `${wrote} written, ${targets.length - wrote} unchanged`}`);
console.log(`  ${targets.length - missingLink}/${targets.length} advertise their sibling with rel="alternate" in <head>`);
console.log(`  ${totalSvg} inline <svg> dropped and declared in frontmatter; ${totalIframe} iframes rendered as links`);
console.log(`  ${excluded.furniture.length} furniture pages excluded by name:`);
for (const f of excluded.furniture) console.log(`      ${f.padEnd(20)} ${FURNITURE[f]}`);
console.log(`  ${Object.values(excluded.artifact).reduce((a, b) => a + b.length, 0)} artifact pages excluded by kind — Markdown would drop the figures that carry their argument:`);
for (const [k, v] of Object.entries(excluded.artifact)) console.log(`      ${String(v.length).padStart(3)} ${k}`);

if (CHECK && stale) {
  console.error('\n  Markdown siblings are out of date. A .md that says less than its page is the'
    + '\n  drift this tool exists to prevent. Run:\n      node tools/build-markdown.mjs');
  process.exitCode = 1;
}
