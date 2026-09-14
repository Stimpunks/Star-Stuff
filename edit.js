/* edit.js — change the words on a page and copy out a patch somebody can apply.
 *
 * WHY THIS AND NOT A CMS. Decap, Sveltia and TinaCMS are all editors over a CONTENT
 * MODEL: collections of files with named fields. This site has no content model and is
 * not going to grow one. A zine is one self-contained HTML file carrying its own
 * gradient starfield, its own cover composition measured against check-overlap.mjs at
 * two viewports, its own inline palette aliases, and a field guide's entries as
 * JavaScript object literals. There are no fields to put in a schema — which is the
 * same reason CLAUDE.md gives for everything else here being a page rather than a
 * folder: collections are outputs, not inputs.
 *
 * The need underneath the CMS question is much smaller: change some words on a page
 * without editing raw HTML. That is this.
 *
 * NOTHING IS SHIPPED TO READERS. No page includes this file. It arrives from a
 * bookmark, so a normal visit fetches nothing extra and no page markup changes at all —
 * which matters on a site that self-hosts twenty woff2 files to avoid one third-party
 * request.
 *
 * IT CANNOT SAVE, AND THAT IS THE DESIGN RATHER THAN A SHORTFALL. Saving from a browser
 * needs a token in the page, which is the account problem the CMS question was trying to
 * avoid. It produces a patch instead — the exact text before and after, per block. An
 * exact BEFORE means applying it is verifiable: a session either matches the file or
 * fails loudly, rather than half-matching and quietly mangling a sentence.
 *
 * IT WRITES NOTHING TO YOUR DEVICE, AND THAT IS A DELIBERATE DIVERGENCE FROM THE SISTER
 * SITE. Queering Earth's editor keeps a localStorage key per page so a half-finished
 * edit survives a reload; this one does not, because privacy.html here makes an absolute
 * claim — no cookies, no localStorage, no sessionStorage, no IndexedDB — and then invites
 * the reader to check it: "the strings that would have to appear in it do not appear
 * anywhere in it." One localStorage call in this file would falsify that page by the
 * exact test that page proposes. Edits live in memory, and a beforeunload warning stands
 * in for the persistence. Ryan's call, 2026-09-13.
 *
 * THE CSP DECIDED HOW THIS IS DISTRIBUTED, AND IT WAS MEASURED RATHER THAN REASONED.
 * Star Stuff ships a hash-based Content-Security-Policy that Queering Earth does not.
 * Served with the real 2,197-byte policy and driven over CDP in Chrome 152, with an
 * injected inline <script> as the control to prove the policy was live (it was refused):
 *
 *     injected <script src="/edit.js">   ALLOWED — script-src 'self'
 *     injected <style> element           ALLOWED — style-src 'unsafe-inline'
 *     style="" set from script           ALLOWED
 *     javascript: URL in an <a href>     BLOCKED — "Running the JavaScript URL violates
 *                                        the following Content Security Policy directive"
 *
 * So the sister site's one element that both drags AND runs cannot do both here. The link on
 * design.html is drag-only and says so, and a console line is published beside it as a
 * fallback for any browser that declines to run a bookmarklet on a page carrying a policy.
 *
 * THE BOOKMARKLET ITSELF RUNS IN SAFARI — Ryan, by hand, 2026-09-13, and Safari was the
 * case worth checking, because that exemption is each browser's own decision rather than
 * something the policy grants, and Safari is where it has differed before. It had to be
 * tested by hand and still would: there is no CDP command that simulates a bookmarks-bar
 * click, and Runtime.evaluate is exempt from the page's CSP the same way the debugger is
 * exempt from its eval restriction, so automating it would prove nothing. Chrome and
 * Firefox are not claimed here, only unsurprising; if you check them, say so on
 * design.html rather than leaving the next reader to re-derive it.
 *
 * WHAT IT REFUSES TO EDIT IS THE MOST IMPORTANT PART OF IT, and this site's refusals are
 * not the sister site's. Quotations and attributions, yes — FACTCHECK.md exists because
 * the characteristic failure here is a TIGHTENED source, and a tool that let anybody
 * reword a pull-quote in two clicks would be a machine for producing exactly that. But
 * also four this site has and that one does not:
 *
 *   - the epistemic notation. joint-documented / -contested / -leap on the chain zines,
 *     the Glimmer Wire verification grades, the Trigger readiness tiers. A browser tool
 *     that turns "contested" into "documented" in one keystroke is a laundering machine,
 *     and that notation is the entire point of How We Got Here.
 *   - cards. build-derived.mjs reads <a class="card"> to generate whats-new.html, feed.xml
 *     and llms.txt, and build-search-index.mjs indexes them. One edited tagline goes stale
 *     in two generators at once. That is not a change a per-block patch can carry.
 *   - field-guide entries. Twenty-five guides build their entries from JavaScript object
 *     literals, so the prose sits inside single-quoted JS strings and not in any HTML
 *     block. A careful applier would find no match and stop; an incautious one would find
 *     the string in the script and replace it, and one apostrophe in the new wording would
 *     close the quote and take the whole guide down.
 *   - covers. A cover is a measured composition. check-overlap.mjs gates the ornament
 *     placement at 1280 and 375, and changing the words moves the title wrap under it.
 */
(function () {
  'use strict';

  if (window.__ssEdit) { window.__ssEdit.focus(); return; }

  /* ── pages this refuses to open at all ─────────────────────────────────────
     whats-new.html and the feed are written by tools/build-derived.mjs from the
     collection pages' own cards. A hand edit here does not conflict, it REVERTS,
     silently, on the next run — which is exactly what happened to the skip-link
     pass on 2026-09-09, with the tool reporting a clean successful build. */
  var GENERATED = { '/whats-new.html': 'build-derived.mjs', '/whats-new': 'build-derived.mjs' };
  var here = location.pathname.replace(/\/index\.html$/, '/');
  if (GENERATED[here]) {
    window.alert('This page is generated by tools/' + GENERATED[here] + ' from the collection'
      + ' pages’ own cards. A hand edit here is not kept — it is overwritten on the next'
      + ' run, and the tool reports a clean build while doing it. Edit the card instead.');
    return;
  }

  var main = document.querySelector('main');
  if (!main) { window.alert('No <main> on this page — nothing to edit.'); return; }

  /* h4, dd and dt are deliberately absent: there are zero of each on this site.

     td and th are absent for a reason rather than an oversight. A table here is a
     ledger — a contrast floor, a palette, a set of readiness grades — and a ledger you
     can edit in a browser is not a ledger. That exclusion is STRUCTURAL, and it needs
     no refusal rule: there is not one p, li, h1, h2 or h3 inside a <table> anywhere on
     this site, measured across all 207 pages, so no editable block can sit in one.

     A `table` refusal WAS written, and the per-rule counter in check-edit-ui.mjs showed
     it firing nowhere. It was removed on the argument this repo applied to a dead print
     selector the same morning: a rule that has never matched anything is not coverage,
     it is something a later reader has to check before they can rule it out. If td and
     th are ever added above, the refusal comes back with them. */
  var EDITABLE = 'p, li, h1, h2, h3';

  /* ── the refusals ──────────────────────────────────────────────────────────
     Each carries the reason a contributor is shown where they try, because a
     refusal nobody can read is indistinguishable from a bug. */
  var REFUSED = [
    ['blockquote, .pull-quote, .pullquote, .sp-pullquote, .blockquote, .quote,'
     + ' .creed-quote, .voice-quote, .turtle-quote, .invite-quote',
     'A quotation is not reworded in a browser — change it in the source, with the'
     + ' primary in front of you. The failure this site is organised against is not an'
     + ' invented source, it is a tightened one.'],

    ['cite, figcaption, .cite, .es-cite, .q-source, .b-source, .g-source, .egg-source,'
     + ' .quote-source, .sources, .sources-head, .refs, .lp-sources, .attribution,'
     + ' .artcredit, .voice-attr, .sp-pullquote-attr',
     'This is an attribution, and it is not edited in a browser. Every quotation here is'
     + ' traced to a primary and logged in FACTCHECK.md; a citation changed in two clicks'
     + ' has no such trace behind it.'],

    ['.colophon, .colophon-sources, .sp-colophon',
     'A colophon holds the sources and the credits — that is why build-search-index.mjs'
     + ' keeps colophons and strips the rest of the running furniture, and why this does'
     + ' not touch them.'],

    ['.joint, .joint-line, .joint-note, .grade',
     'This is an epistemic grade — documented / contested / leap on a chain, verified /'
     + ' contested on the Wire, a readiness tier on a Trigger. A convenience tool that'
     + ' promotes a contested joint to a documented one is a laundering machine.'],

    ['.card-wrap, .card, .card-details, .hero-count',
     'A card’s words are read by tools/build-derived.mjs to write whats-new.html,'
     + ' feed.xml and llms.txt, and indexed by build-search-index.mjs. Editing one goes'
     + ' stale in two generators at once, which is more than a per-block patch can carry.'],

    ['.field-grid, .entry, .entry-notes',
     'This entry is rendered from a JavaScript object in this page’s own source, so its'
     + ' words live inside a quoted string rather than in any HTML block. A patch could'
     + ' not say where they are — and one apostrophe in the wrong place closes the quote'
     + ' and takes the whole guide down.'],

    ['.cover, .cover-title, .cover-subtitle, .cover-issue, .cover-corner, .cover-motif,'
     + ' .cover-refrain, .cover-meta, .cover-scroll',
     'A cover is a measured composition. check-overlap.mjs gates where the ornaments sit'
     + ' at 1280px and at 375px, and changing the words moves the title wrap underneath'
     + ' them — so a cover edit is a re-measurement, not a rewording.'],

    ['.ss-nav, .masthead-toc, .spread-footer, .whats-new-list, .lp-row, .search-results,'
     + ' .toc, .index-list',
     'This is site furniture built from the page rather than written on it. Change the'
     + ' thing it points at.'],

    /* .colophon-footer is inside a .colophon on the zines and standalone on the 52
       prose pages, so it needs naming in its own right — the entry above catches it
       only on the zines, which is the kind of half-coverage that reads as complete. */
    ['.colophon-footer, .hero-eyebrow, .masthead-eyebrow, .masthead-tagline, .nav-brand,'
     + ' .ss-cobrand',
     'This is the shared masthead: the Stimpunks × More Realms pairing, or the tagline.'
     + ' Both have fixed forms — Stimpunks always first, × for the collaboration and'
     + ' never · — and they are the same on every page, so one is not changed on one.'],
  ];

  /* An attribution line directly under a quotation is refused with the quotation, which
     is how "— Carl Sagan, Cosmos" stays out of reach without refusing the several
     hundred .annotation elements that are ordinary diagram captions. */
  var QUOTE_SEL = REFUSED[0][0];
  function isQuoteTrailer(el) {
    if (!el.matches('.annotation, .caption, .figure-note, .diagram-caption')) return false;
    var prev = el.previousElementSibling;
    return !!(prev && (prev.matches(QUOTE_SEL) || prev.querySelector(QUOTE_SEL)));
  }

  /* CONTAINS, NOT ONLY CONTAINED BY, AND THAT IS A STAR STUFF DIFFERENCE RATHER THAN A
     REFINEMENT. The sister site's refusals are all containers, so closest() alone was
     right there. Here the epistemic markers are INLINE: a Trigger's readiness tier is
     `<p class="meta"><span class="grade deployed">Deployed</span>`, and closest('.grade')
     on that paragraph returns null. Measured with closest() alone, trigger-overshoot.html
     refused 0 of its blocks and every readiness grade on the page was editable — which
     is precisely the laundering the refusal exists to stop, arriving through the door the
     refusal was written for. A block that CONTAINS a refused thing is refused, because
     editing the block edits the thing. */
  /* Per-rule tally, read by tools/check-edit-ui.mjs. A refusal rule that never fires
     anywhere on the site is a comment rather than a control, and the only way to know
     which is which is to count them — the same reason every exemption list in tools/
     prints its own size. */
  var firedBy = {};
  function refusalFor(el) {
    for (var i = 0; i < REFUSED.length; i++) {
      if (el.closest(REFUSED[i][0]) || el.querySelector(REFUSED[i][0])) {
        firedBy[i] = (firedBy[i] || 0) + 1;
        return REFUSED[i][1];
      }
    }
    if (isQuoteTrailer(el)) { firedBy.trailer = (firedBy.trailer || 0) + 1; return REFUSED[1][1]; }
    return null;
  }

  /* ── the blocks ────────────────────────────────────────────────────────────
     Innermost only: a <p> inside a <li> is one block, not two, and editing the
     outer one would swallow the inner one's markup into the patch. */
  function blocks() {
    var all = Array.prototype.slice.call(main.querySelectorAll(EDITABLE));
    return all.filter(function (el) {
      return !el.closest('.ss-edit-ui')
        && el.textContent.replace(/\s+/g, '').length > 1
        && !all.some(function (o) { return o !== el && o.contains(el); });
    });
  }

  /* ── the record of what changed ────────────────────────────────────────────
     Keyed by the block's ORIGINAL html, which is also what the patch quotes, so a
     block edited twice reports one before and one after rather than a chain.
     In memory only. Nothing is written to your device; see the note at the top. */
  var edits = {};

  /* Where in the page an edit is, for the patch. Zines are #spread-N, prose pages
     are the nearest preceding h2[id] — both are real addresses on this site,
     because search-index.json records are anchored on exactly these. */
  function whereIs(el) {
    var spread = el.closest('[id^="spread-"]');
    if (spread) return '#' + spread.id;
    var heads = Array.prototype.slice.call(main.querySelectorAll('h2[id], h3[id]')), best = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] === el) { best = heads[i]; break; }
      if (heads[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) best = heads[i];
    }
    return best ? '#' + best.id : null;
  }

  /* ── furniture ─────────────────────────────────────────────────────────────
     Every surface declares an opaque background, so the contrast of this UI is a
     fixed pair rather than whatever it happens to be composited over. The gating
     ground on this site is --sp-card (#0f0f2a), not the void: it is the LIGHTEST
     thing text sits on, which on a dark site is the worst case. starstuff.css
     records the same thing where --sp-dim-soft was raised — "4.97:1 on --sp-void
     and 4.73:1 on the lightest ground, --sp-card".

     Fallbacks are spelled out after every var() because this file can be dropped on
     a page whose stylesheet did not load. */
  var CARD = 'var(--sp-card, #0f0f2a)';
  var VOID = 'var(--sp-void, #0a0a14)';
  var WHITE = 'var(--sp-white, #f9fafb)';
  var GOLD = 'var(--sp-gold, #fbbf24)';
  var PURPLE = 'var(--sp-purple, #a78bfa)';
  var CYAN = 'var(--sp-cyan, #22d3ee)';
  var MUTED = 'var(--sp-muted, #c4b5d4)';
  var FONT = "'Atkinson Hyperlegible Next', system-ui, sans-serif";

  var style = document.createElement('style');
  style.textContent = [
    '.ss-edit-bar{position:sticky;top:0;z-index:9999;box-sizing:border-box;width:100%;',
      'margin:0 0 1.5rem;padding:0.75rem 1rem;background:' + CARD + ';',
      'border-bottom:2px solid ' + GOLD + ';color:' + WHITE + ';',
      'font-family:' + FONT + ';font-size:0.95rem;line-height:1.55;',
      'display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center}',
    '.ss-edit-bar p{margin:0;color:' + WHITE + ';font-size:0.95rem;line-height:1.55;flex:1 1 22rem}',
    /* The controls travel together. Left loose in the bar's own flex they wrapped one
       at a time, so "Copy my edits" — the button the whole tool exists to reach —
       ended up alone on a line away from the other two. */
    '.ss-edit-actions{display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center}',
    '.ss-edit-bar strong{color:' + GOLD + '}',
    /* 44x44 is the floor on every control, and the 0.75rem gap above keeps two of
       them from touching. Both are measured by tools/check-edit-ui.mjs. */
    '.ss-edit-bar button{font:inherit;font-family:' + FONT + ';font-size:0.95rem;',
      'color:' + WHITE + ';background:' + VOID + ';border:1px solid ' + PURPLE + ';',
      'border-radius:8px;padding:0.6rem 1rem;cursor:pointer;',
      'min-height:44px;min-width:44px}',
    '.ss-edit-bar button:hover{border-color:' + GOLD + '}',
    '.ss-edit-bar button:focus-visible{outline:2px solid ' + CYAN + ';outline-offset:2px}',
    '.ss-edit-bar button[disabled]{color:var(--sp-dim-soft,#807d98);border-color:var(--sp-dim-soft,#807d98);cursor:default}',
    '.ss-edit-count{color:' + MUTED + ';font-family:' + FONT + ';font-size:0.95rem}',
    '.ss-edit-out{width:100%;flex-basis:100%;min-height:18rem;font-family:\'Space Mono\',ui-monospace,monospace;',
      'font-size:0.8rem;line-height:1.5;color:' + WHITE + ';background:' + VOID + ';',
      'border:1px solid ' + PURPLE + ';border-radius:8px;padding:0.75rem}',
    /* The dashed outline says editable; the dotted one says refused, so what is off
       limits is visible BEFORE somebody clicks it rather than only after. */
    'html.ss-editing [data-ss-edit]{outline:1px dashed ' + PURPLE + ';outline-offset:5px;cursor:text}',
    'html.ss-editing [data-ss-edit]:focus{outline:2px solid ' + CYAN + ';outline-offset:5px}',
    'html.ss-editing [data-ss-changed]{outline:2px solid ' + GOLD + ';outline-offset:5px}',
    'html.ss-editing [data-ss-refused]{outline:1px dotted var(--sp-dim-soft,#807d98);outline-offset:5px;cursor:not-allowed}',
    '.ss-edit-why{position:fixed;left:50%;transform:translateX(-50%);bottom:1.5rem;z-index:10000;',
      'box-sizing:border-box;width:min(34rem,calc(100vw - 2rem));background:' + CARD + ';',
      'border:1px solid ' + GOLD + ';border-radius:8px;padding:0.85rem 1rem;color:' + WHITE + ';',
      'font-family:' + FONT + ';font-size:0.95rem;line-height:1.55}',
    '@media print{.ss-edit-bar,.ss-edit-why{display:none!important}}',
    '@media (forced-colors: active){.ss-edit-bar,.ss-edit-why{border-color:CanvasText}}',
  ].join('');
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'ss-edit-bar ss-edit-ui';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Editing this page');
  bar.innerHTML =
    '<p><strong>Editing this page.</strong> Click any paragraph and change the words. '
    + 'Dotted outlines are the things this refuses to edit — press one and it says why. '
    + '<strong>Nothing is saved</strong>, here or anywhere: press <strong>Copy my edits</strong> '
    + 'and paste them to Ryan or Helen, or into a Claude session.</p>'
    + '<span class="ss-edit-actions">'
    + '<button type="button" id="ss-edit-copy">Copy my edits</button>'
    + '<button type="button" id="ss-edit-reset">Undo all</button>'
    + '<button type="button" id="ss-edit-stop">Stop editing</button>'
    + '<span class="ss-edit-count" id="ss-edit-count" role="status"></span>'
    + '</span>';
  main.parentNode.insertBefore(bar, main);

  var why = null, whyTimer = null;
  function explain(text) {
    if (why) why.remove();
    if (whyTimer) clearTimeout(whyTimer);
    why = document.createElement('div');
    why.className = 'ss-edit-why ss-edit-ui';
    why.setAttribute('role', 'status');
    why.textContent = text;
    document.body.appendChild(why);
    whyTimer = setTimeout(function () { if (why) { why.remove(); why = null; } }, 9000);
  }

  var countEl = bar.querySelector('#ss-edit-count');
  function paint() {
    var n = Object.keys(edits).length;
    countEl.textContent = n === 0 ? 'no edits yet' : n === 1 ? '1 edit' : n + ' edits';
    bar.querySelector('#ss-edit-copy').disabled = n === 0;
    bar.querySelector('#ss-edit-reset').disabled = n === 0;
  }

  /* ── arm the page ──────────────────────────────────────────────────────────
     Hidden spreads are armed too. A paged zine shows one .spread at a time, so
     arming only what is visible would leave eleven twelfths of a zine uneditable
     and the contributor with no way to tell that from a page with nothing to edit. */
  document.documentElement.classList.add('ss-editing');

  var armed = 0, refusedCount = 0;
  blocks().forEach(function (el, i) {
    var refusal = refusalFor(el);
    if (refusal) {
      refusedCount++;
      el.dataset.ssRefused = '1';
      /* preventDefault, BECAUSE ON THE CARD PAGES A REFUSED BLOCK IS INSIDE A LINK.
         .card-tagline and .card-desc sit inside <a class="card">, so without this a
         contributor pressing one navigates to the piece and never sees the refusal at
         all — the explanation is the entire reason the refusal is worth having, and it
         was firing on every page except the two kinds where refusals are densest.
         Found by the audit, not by eye: collection-star-stuff.html reported three
         controls where every other page reported four, because the click had taken the
         page with it mid-measurement. */
      el.addEventListener('click', function (e) {
        if (el.closest('a[href]')) { e.preventDefault(); e.stopPropagation(); }
        explain(refusal);
      });
      return;
    }
    armed++;
    el.dataset.ssEdit = String(i);
    el.dataset.ssOriginal = el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');

    /* Paste arrives as plain text. A paste from a word processor otherwise brings its
       own fonts and colours into a page whose palette is a single source of truth in
       starstuff.css, and inline style attributes are the one thing the CSP still has
       to permit wholesale. */
    el.addEventListener('paste', function (e) {
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData('text');
      document.execCommand('insertText', false, t);
    });

    /* Enter would split the block in two. This changes words; it does not restructure
       a page, and a new paragraph is a thing somebody should write in the source
       — where it can be given its id, its place in the spread and its own contrast. */
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        explain('Enter is off here — this changes words, it does not add paragraphs.');
      }
    });

    el.addEventListener('input', function () {
      var before = el.dataset.ssOriginal, after = el.innerHTML;
      if (after === before) { delete edits[before]; delete el.dataset.ssChanged; }
      else {
        edits[before] = { after: after, where: whereIs(el), tag: el.tagName.toLowerCase() };
        el.dataset.ssChanged = '1';
      }
      paint();
    });
  });

  /* ── getting them out ──────────────────────────────────────────────────────
     THE PATCH IS DECODED TEXT, NOT THE FILE'S BYTES, AND THAT IS NOT A SHORTCUT.
     innerHTML decodes entities, so an exact byte-for-byte BEFORE is not available
     from a browser at all. Re-encoding on the way out cannot rescue it either,
     because the sources are mixed: measured on this repo, 9,944 raw em dashes
     against 6,948 &mdash;. No encoding reproduces a file that is not consistent
     with itself, so the honest move is to export decoded text and tell the applier
     to match on decoded text — and to STOP rather than guess. */
  /* Digits are the easy half. This site spells its counts out at least as often —
     "eleven pieces", "twenty-four guides, 308 entries", "eight eggs" — and a flag that
     only saw digits would miss the wording the collection pages actually use. A false
     positive costs one advisory line in the patch, which is the right side to err on
     for a figure no gate on this site can read. */
  var NUMBER_WORDS = new RegExp('\\b(one|two|three|four|five|six|seven|eight|nine|ten|'
    + 'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|'
    + 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\\b', 'i');
  function looksNumeric(s) { return /\d/.test(s) || NUMBER_WORDS.test(s); }

  function asText() {
    var keys = Object.keys(edits);
    var flagged = keys.filter(function (k) { return looksNumeric(k) || looksNumeric(edits[k].after); });
    var out = [
      'Edits to ' + location.pathname.replace(/^\//, ''),
      location.href,
      new Date().toLocaleString() + '  ·  ' + keys.length + (keys.length === 1 ? ' edit' : ' edits'),
      '',
      'HOW TO APPLY THESE',
      '',
      'BEFORE and AFTER are each block with HTML ENTITIES DECODED, because that is what a',
      'browser gives back and there is no way to get the file’s own bytes out of one. This',
      'repo is entity-mixed — 9,944 raw em dashes against 6,948 &mdash; — so no re-encoding',
      'could reproduce it either. These will not match the file byte for byte and are not',
      'meant to.',
      '',
      '  1. In the file named above, find the block whose text, WITH ENTITIES DECODED,',
      '     equals BEFORE exactly.',
      '  2. If there is no such block, STOP and say so. Do not apply a near match.',
      '  3. Replace its contents with AFTER, writing entities the way the surrounding',
      '     lines of that same file write them.',
      '  4. Then run, from the repo root:',
      '       node tools/check-markup.mjs --check',
      '       node tools/check-contrast.mjs --check ' + location.pathname.replace(/^\//, ''),
      '       node tools/check-overlap.mjs --check ' + location.pathname.replace(/^\//, ''),
      '       node tools/build-search-index.mjs        # page text changed',
      '',
    ];
    if (flagged.length) {
      out.push('  ONE OF THESE EDITS TOUCHES A FIGURE (' + flagged.length
        + (flagged.length === 1 ? ' block).' : ' blocks).'));
      out.push('  Every count in this site’s prose is a lead, not a fact, and no gate can read');
      out.push('  one — so re-derive it from the thing it counts before applying, and grep for');
      out.push('  the same number on the other pages that quote it.');
      out.push('');
    }
    keys.forEach(function (before, i) {
      var rec = edits[before];
      out.push('--- edit ' + (i + 1) + (rec.where ? '  ·  ' + rec.where : '') + '  ·  <' + rec.tag + '>');
      out.push('BEFORE');
      out.push(before);
      out.push('AFTER');
      out.push(rec.after);
      out.push('');
    });
    return out.join('\n');
  }

  function fallback(text) {
    var existing = bar.querySelector('.ss-edit-out');
    if (existing) existing.remove();
    var box = document.createElement('textarea');
    box.className = 'ss-edit-out ss-edit-ui';
    box.value = text;
    box.setAttribute('aria-label', 'Your edits — select all and copy this text');
    bar.appendChild(box);
    box.focus();
    box.select();
  }

  bar.querySelector('#ss-edit-copy').addEventListener('click', function () {
    var text = asText(), btn = this;
    var done = function () {
      btn.textContent = 'Copied — now paste it';
      setTimeout(function () { btn.textContent = 'Copy my edits'; }, 4000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); });
    } else {
      fallback(text);
    }
  });

  bar.querySelector('#ss-edit-reset').addEventListener('click', function () {
    if (!window.confirm('Undo all ' + Object.keys(edits).length + ' edits on this page?')) return;
    blocks().forEach(function (el) {
      if (el.dataset.ssOriginal !== undefined) {
        el.innerHTML = el.dataset.ssOriginal;
        delete el.dataset.ssChanged;
      }
    });
    edits = {};
    paint();
  });

  bar.querySelector('#ss-edit-stop').addEventListener('click', function () { location.reload(); });

  /* Nothing is written to your device, so an unloaded page takes the edits with it.
     This is the guard that stands in for the persistence the sister site has. */
  window.addEventListener('beforeunload', function (e) {
    if (!Object.keys(edits).length) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  window.__ssEdit = {
    focus: function () { bar.scrollIntoView({ block: 'start' }); },
    /* Read by tools/check-edit-ui.mjs, which is the only thing that can measure this
       file — no page loads it, so all nine gates are structurally blind to it. */
    stats: function () {
      return { armed: armed, refused: refusedCount, edits: Object.keys(edits).length,
               firedBy: firedBy, rules: REFUSED.length };
    },
    patch: asText,
  };
  paint();
})();
