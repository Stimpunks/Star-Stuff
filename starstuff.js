/* Star Stuff — shared front-end behaviors
   =================================================================
   Three features, all driven entirely from this shared file so that
   every paged zine inherits them just by including <script src="starstuff.js">:

     0. The pager itself              — changePage(), the prev/next buttons and
        the arrow keys, with the spread count read from the DOM rather than
        declared per page. Installed only if the page has not defined its own.

     1. Per-spread footer navigation  — prev / page-number / next controls
        added to the bottom of each spread's .spread-footer.

     2. Deep linking to spreads       — #spread-N in the URL opens that
        spread, and the hash tracks the current spread as the reader moves,
        so the address bar is always a shareable link.

   Both are safe no-ops on any page that isn't a paged zine (i.e. one that
   lacks a global changePage() plus .spread / .spread-footer elements).

   Navigation is always performed through the page's OWN changePage()
   function. That function keeps its own internal `current` counter, so
   routing every jump through it (rather than toggling classes directly)
   keeps the inline script's state in sync with the DOM. */
(function () {
  'use strict';

  /* ---------- shared helpers ---------- */

  function spreadList() {
    return Array.prototype.slice.call(document.querySelectorAll('.spread'));
  }

  function spreadCount() {
    return document.querySelectorAll('.spread').length;
  }

  // 1-based index of the currently active spread (0 if none is active).
  // Positional order matches the spread-N ids, which run 1..N in document order.
  function currentIndex() {
    return spreadList().indexOf(document.querySelector('.spread.active')) + 1;
  }

  /* =================================================================
     0) The pager itself
     -----------------------------------------------------------------
     Added 2026-09-13. Until then every paged zine carried its own copy of
     changePage() inline — 107 of them, in 17 variants, 115,101 bytes, and the
     ONLY thing that differed between the variants was `const total = N`. That
     number is the count of .spread elements, which this file already computes
     as spreadCount(): on all 107 pages the declared total matched the DOM count
     exactly, with no exceptions. So it was 107 copies of one function keeping a
     constant the page could not get wrong without the copy being wrong too.

     It also cost the CSP. Each variant is a distinct inline script body needing
     its own hash in _headers, so seventeen near-identical functions bought
     seventeen hashes; moving the code into this file retires all of them.

     THE PAGE MAY STILL OWN IT. install() returns early if window.changePage is
     already a function, so a page with special paging keeps its own and this one
     stays out of the way — shorthand-evolution.html does not load this file at
     all and is unaffected. Everything else here already routed through
     window.changePage (see the header note), so nothing else changed.

     NOT A PAGER, NOT INSTALLED. The guard is prev-btn AND next-btn AND at least
     one .spread. The two scroll zines have .spread sections and spread-N ids but
     no buttons, which is exactly how they are meant to work: they get no pager,
     window.changePage stays undefined, and buildFooterNav below returns early on
     its own. A guard on .spread alone would have paged them. */
  function pagerParts() {
    return {
      prev: document.getElementById('prev-btn'),
      next: document.getElementById('next-btn'),
      counter: document.getElementById('page-counter')
    };
  }

  // Counter text and button state for spread n of total. Each element is
  // optional: a zine may carry buttons and no counter.
  function paintPager(n, total) {
    var p = pagerParts();
    if (p.counter) p.counter.textContent = n + ' / ' + total;
    if (p.prev) {
      p.prev.disabled = n === 1;
      p.prev.classList.toggle('active', n > 1);
    }
    if (p.next) {
      p.next.disabled = n === total;
      p.next.classList.toggle('active', n < total);
    }
  }

  // Positional, not by id: spreadList() is document order, which is what the
  // spread-N ids already follow. Reading position from the DOM is what lets the
  // page-specific `total` constant go away.
  function defaultChangePage(dir) {
    var spreads = spreadList();
    var total = spreads.length;
    var cur = currentIndex();
    if (!total || cur < 1) return;
    var next = cur + dir;
    if (next < 1 || next > total) return;
    spreads[cur - 1].classList.remove('active');
    spreads[next - 1].classList.add('active');
    paintPager(next, total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function installPager() {
    if (typeof window.changePage === 'function') return;   // the page owns it
    var p = pagerParts();
    if (!p.prev || !p.next) return;                        // not a paged zine
    var total = spreadCount();
    if (!total) return;
    if (currentIndex() < 1) spreadList()[0].classList.add('active');
    window.changePage = defaultChangePage;
    paintPager(currentIndex(), total);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') window.changePage(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') window.changePage(-1);
    });
  }

  /* =================================================================
     1) Per-spread footer navigation
     ================================================================= */
  function buildFooterNav() {
    if (typeof window.changePage !== 'function') return;

    var spreads = spreadList();
    var footers = document.querySelectorAll('.spread-footer');
    if (!spreads.length || !footers.length) return;

    var lastIndex = spreads.length - 1;

    footers.forEach(function (footer) {
      if (footer.querySelector('.spread-footer-nav')) return; // stay idempotent

      var index = spreads.indexOf(footer.closest('.spread'));

      var nav = document.createElement('span');
      nav.className = 'spread-footer-nav';

      var prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'spread-nav-btn prev';
      prev.setAttribute('aria-label', 'Previous spread');
      prev.textContent = '\u2039 prev';
      prev.addEventListener('click', function () { window.changePage(-1); });
      if (index <= 0) prev.disabled = true;

      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'spread-nav-btn next';
      next.setAttribute('aria-label', 'Next spread');
      next.textContent = 'next \u203a';
      next.addEventListener('click', function () { window.changePage(1); });
      if (index === lastIndex) next.disabled = true;

      // Relocate the existing page number into the middle of the cluster:
      //   [ title ................ ‹ prev   N   next › ]
      var counter = footer.querySelector('.spread-footer-right');

      nav.appendChild(prev);
      if (counter) nav.appendChild(counter);
      nav.appendChild(next);
      footer.appendChild(nav);
    });
  }

  /* =================================================================
     2) Deep linking to spreads  (#spread-N)
     ================================================================= */

  var suppressHashSync = false; // guards the (rare) fallback write path

  function spreadFromHash() {
    var m = /^#spread-(\d+)$/.exec(window.location.hash || '');
    return m ? parseInt(m[1], 10) : null;
  }

  // Move to spread n by asking the page's own changePage() for the right
  // relative step, so its internal counter stays correct. A single call
  // handles any distance because changePage does current + dir in one go.
  function goToSpread(n) {
    if (typeof window.changePage !== 'function') return;
    if (!(n >= 1 && n <= spreadCount())) return;
    var cur = currentIndex();
    if (cur < 1 || cur === n) return;
    window.changePage(n - cur);
  }

  function writeHash(n) {
    var desired = '#spread-' + n;
    if (window.location.hash === desired) return;
    suppressHashSync = true;
    try {
      if (window.history && window.history.replaceState) {
        // replaceState updates the address bar without a new history entry
        // and without firing hashchange — ideal for reflecting live state.
        window.history.replaceState(null, '', desired);
      } else {
        window.location.hash = desired;
      }
    } finally {
      setTimeout(function () { suppressHashSync = false; }, 0);
    }
  }

  function syncHashToCurrent() {
    var n = currentIndex();
    if (n >= 1) writeHash(n);
  }

  function onHashChange() {
    if (suppressHashSync) return; // ignore hashes we wrote ourselves
    var n = spreadFromHash();
    if (n) goToSpread(n);
  }

  function setupDeepLinks() {
    if (typeof window.changePage !== 'function') return;
    if (spreadCount() < 2) return;

    // Whenever any spread's active state changes — by top nav, footer nav,
    // keyboard, or a deep-link jump — repoint the hash at the current spread.
    if (typeof window.MutationObserver === 'function') {
      var observer = new MutationObserver(syncHashToCurrent);
      spreadList().forEach(function (spread) {
        observer.observe(spread, { attributes: true, attributeFilter: ['class'] });
      });
    }

    window.addEventListener('hashchange', onHashChange);

    // Honor a deep link present on initial load. A plain URL (no hash)
    // is left alone — it is already "spread 1".
    var initial = spreadFromHash();
    if (initial) goToSpread(initial);
  }

  /* =================================================================
     3) Deep linking to field-guide entries  (#entry-slug)

     The field guides render their entries from JS data and keep each entry's
     "Field notes" collapsed behind `.entry.open`. A link straight to an entry
     therefore used to land on a closed card, with the text the reader was sent
     for still hidden — which is exactly what a search result does. So when the
     URL points at an entry, open it as well as scroll to it.

     The entries do not exist at DOMContentLoaded on every guide (they are built
     by each page's own script, and script order varies), so if the target is not
     there yet we watch briefly for it to appear rather than guessing at a delay.

     Safe elsewhere: changelog.html also uses `.entry`, but those carry no
     .entry-notes, and openEntry() declines anything without one.
     ================================================================= */

  function openEntry(el) {
    if (!el || !el.classList || !el.classList.contains('entry')) return false;
    var notes = el.querySelector('.entry-notes');
    if (!notes) return false;                              // not a collapsible guide entry
    if (!el.classList.contains('open')) {
      el.classList.add('open');
      el.setAttribute('aria-expanded', 'true');
      var label = el.querySelector('.entry-expand');
      // Match the arrow the page's own click handler would have set.
      if (label) label.textContent = '▾ Field notes';
    }
    /* The notes are rendered with hidden="until-found" (2026-09-10) so find-in-page
       can reach them. `.entry.open` reveals them through content-visibility, so
       clearing the attribute is not what makes them visible — it is what stops the
       element claiming to be hidden while it is on screen. Assistive tech reads the
       attribute, not the class. */
    if (notes.hasAttribute('hidden')) notes.removeAttribute('hidden');
    return true;
  }

  /* ── 4) Find-in-page into a collapsed field note ──────────────────────────────
     Each guide renders its notes with hidden="until-found", which keeps the text
     reachable by Ctrl/Cmd+F and by a scroll-to-text fragment while it is collapsed.
     When the browser finds a match inside one it fires `beforematch`, strips the
     attribute and scrolls to it — but it knows nothing about `.entry.open`, so
     without this the note would be revealed while the card still showed a collapsed
     chevron and `aria-expanded="false"`. That mismatch is the mistake the spec names.

     `beforematch` BUBBLES, so one delegated listener covers every entry on the page
     and needs no hook into each guide's own render loop — which matters, because the
     entries do not exist when this file runs on the guides that load it first.

     The 24 guides' own click handlers are deliberately untouched: they toggle
     `.open`, and the CSS rule added alongside the attribute makes that class reveal
     the notes on its own. Two paths to the same state, and neither has to know about
     the other. */
  document.addEventListener('beforematch', function (e) {
    var notes = e.target && e.target.closest ? e.target.closest('.entry-notes') : null;
    if (!notes) return;
    var entry = notes.closest('.entry');
    if (entry) openEntry(entry);
  }, true);

  function entryFromHash() {
    var hash = window.location.hash || '';
    if (hash.length < 2) return null;
    if (/^#spread-\d+$/.test(hash)) return null;           // handled above
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (e) { id = hash.slice(1); }
    return document.getElementById(id);
  }

  function revealHashEntry() {
    var el = entryFromHash();
    if (!openEntry(el)) return false;
    // Scroll after expanding, so the target lands correctly with the notes open.
    if (el.scrollIntoView) el.scrollIntoView({ block: 'start' });
    return true;
  }

  function setupEntryDeepLinks() {
    window.addEventListener('hashchange', revealHashEntry);

    if (!window.location.hash) return;
    if (revealHashEntry()) return;
    if (typeof window.MutationObserver !== 'function') return;

    // The grid has not been built yet — wait for it, then give up quietly.
    var done = false;
    var observer = new MutationObserver(function () {
      if (done) return;
      if (revealHashEntry()) {
        done = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      if (!done) { done = true; observer.disconnect(); }
    }, 3000);
  }

  /* =================================================================
     1b) The page's OWN top prev/next bar
     =================================================================
     Every paged zine carries `<button id="prev-btn">` and `<button id="next-btn">`
     in a .nav-controls bar above the spread. Those two buttons used to call
     changePage() through an `onclick=` attribute — 202 of them across 100 pages —
     and an inline event handler cannot be covered by an ordinary CSP hash: it needs
     the 'unsafe-hashes' keyword, which weakens script-src for the whole site to
     permit six strings. Binding them here costs nothing and lets that keyword go.

     Deliberately NOT merged into buildFooterNav(): that function builds the
     *injected* per-spread footer controls and returns early when a page has no
     .spread-footer. These two buttons exist on pages independently of that, so
     folding them in would silently skip any page that has a pager and no footer.

     Calls window.changePage at CLICK time rather than capturing it, because
     starstuff.js loads before the page's own inline script on four pages. Idempotent
     via a data flag, since init() can run more than once on a page that is already
     interactive. */
  function bindOwnPager() {
    if (typeof window.changePage !== 'function') return;
    [['prev-btn', -1], ['next-btn', 1]].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el || el.dataset.ssBound) return;
      el.dataset.ssBound = '1';
      el.addEventListener('click', function () { window.changePage(pair[1]); });
    });
  }


  /* ---------- the floating contents rail ----------
     Projected from the page's own .ss-toc rather than written into 33 pages, so
     there is exactly one contents list in the source and the rail cannot drift
     from it. Top-level entries only: the rail is a minimap, and on the pages whose
     contents nest (design.html, love-you-down-to-your-star-stuff.html) including
     the sub-entries would make it longer than the viewport it floats in.

     No-JS readers get the in-body list and no rail, which is the right way round —
     this is an enhancement on top of a contents list that already works.

     The CSS hides it below 1200px, so this runs on every page and the media query
     decides. That is deliberate: building on resize instead would mean a listener
     and a rebuild path, for an element whose content cannot change after load. */
  function tickFor(str) {
    /* Deterministic from the href, so the rail looks the same on every visit —
       a tick stack that reshuffled itself per reload would be a different left
       margin each time you came back to the page.

       WIDTH ONLY, NO LEAN. The sibling rail on queering.earth rotates each tick a
       degree or three, which suits a site whose whole vocabulary is botanical and
       hand-drawn. Ryan's call, 2026-09-14: ours are straight. This is a starfield,
       and the ruled horizontal is the house mark. */
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return { width: 9 + (h % 24) };              // 9–32px
  }

  function buildRail() {
    var toc = document.querySelector('.ss-toc');
    if (!toc || document.querySelector('.ss-rail')) return;
    var items = toc.querySelectorAll(':scope > ul > li > a[href^="#"]');
    if (items.length < 2) return;

    var nav = document.createElement('nav');
    nav.className = 'ss-rail';
    nav.setAttribute('aria-label', 'On this page');
    /* The rail takes the page's own accent, the way .ss-toc does — read off the
       in-body list so the two pieces of furniture cannot disagree. */
    var accent = toc.style.getPropertyValue('--toc-accent');
    if (accent) nav.style.setProperty('--ss-rail-accent', accent.trim());

    var ol = document.createElement('ol');
    Array.prototype.forEach.call(items, function (a) {
      var href = a.getAttribute('href');
      if (!href || !document.getElementById(href.slice(1))) return;
      var li = document.createElement('li');
      li.style.setProperty('--ss-tick', tickFor(href).width + 'px');
      var link = document.createElement('a');
      link.href = href;
      link.textContent = a.textContent.trim();
      li.appendChild(link);
      ol.appendChild(li);
    });
    if (!ol.children.length) return;
    nav.appendChild(ol);

    /* The shooting star. The sibling site ends its rail with a curling sprig; this
       is the same gesture in this site's vocabulary — a trail running off the foot
       of the rule, a four-pointed head, and two sparks behind it. aria-hidden: it
       is punctuation, and a screen reader announcing "image" at the end of a
       contents list would be noise. */
    nav.insertAdjacentHTML('beforeend',
      '<svg class="ss-rail-star" viewBox="0 0 32 34" aria-hidden="true" focusable="false">' +
        '<path class="trail" d="M1.5,1 C2.5,9.5 5.4,16.4 10.2,22.0"></path><path class="trail trail-2" d="M6.8,4 C8.0,10.6 10.2,15.6 13.4,19.6"></path><path class="head" d="M19.5,17.5 L21.7,22.8 L27,25 L21.7,27.2 L19.5,32.5 L17.3,27.2 L12,25 L17.3,22.8 Z"></path><circle class="spark" cx="7.4" cy="26.6" r="0.95"></circle><circle class="spark" cx="26.6" cy="18.6" r="0.7"></circle>' +
      '</svg>');

    document.body.appendChild(nav);
    placeRail(nav);
  }

  /* WHERE THE RAIL SITS, AND WHEN IT GETS OUT OF THE WAY.
     ------------------------------------------------------------------
     The rail reserves its own width and never overlays the prose, so it can only
     appear where the page leaves a margin for it. The thing that makes this
     interesting is that A SINGLE PAGE HAS MORE THAN ONE COLUMN WIDTH. On the eight
     Sound racks the essay runs a 688px column with a generous gutter, and the rack
     below it runs 1040px with its room headings flush to the edge — so the rail
     fits perfectly beside the essay and would sit on the words of the rack.

     Ryan, 2026-09-14, looking at a rack in a browser with the sidebar open: show it
     for the narrow column and let it disappear for the wide one. So the test is not
     "is this page wide" but "is something too wide for the rail ALONGSIDE THE RAIL
     RIGHT NOW" — a scroll question, answered by an IntersectionObserver keyed to the
     rail's own vertical band rather than to the whole viewport.

     Anything with no wide blocks at all — the 25 essay pages — never observes
     anything and the rail simply stays. */
  var RAIL_GAP = 32;   // breathing room between the rail and the words
  var RAIL_EDGE = 12;  // smallest margin we will leave against the window

  function blockInk() {
    /* Each laid-out block in main, with the LEFTMOST PLACE IT ACTUALLY PAINTS.
       Measuring the element box is wrong and was wrong here: a masthead is a
       full-width container with centred text, so by its box it looked like a column
       too wide for the rail and ls-playlist.html hid the rail at the top of the page
       where there was 405px of clear margin. This site already has that lesson
       written down for the cover motifs — measure the union of what is painted,
       never the rect that contains it.

       AND A RANGE OVER THE SUBTREE IS NOT THE PAINTED EXTENT EITHER. The first fix
       used one Range per candidate, which returns the LINE BOXES of block children:
       a centred paragraph in a 1040px container yields a 1040px rect, so the same
       masthead was still the only blocker on the page. Text nodes are the honest
       unit. Walked once for the whole page, pushing each node's left up its own
       ancestor chain, so this stays linear rather than one walk per candidate. */
    var main = document.querySelector('main') || document.body;
    var cand = new Map();
    main.querySelectorAll(':scope > *, :scope > * > *').forEach(function (el) {
      if (el.closest('.ss-rail')) return;
      var box = el.getBoundingClientRect();
      if (box.width < 240 || box.height < 1) return;
      cand.set(el, Infinity);
    });
    if (!cand.size) return [];

    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      var parent = node.parentElement;
      if (!parent || parent.closest('.ss-rail')) continue;
      var range = document.createRange();
      range.selectNodeContents(node);
      var rects = range.getClientRects();
      var left = Infinity;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (r.width < 1 || r.height < 1) continue;
        if (r.left < left) left = r.left;
      }
      if (left === Infinity) continue;
      for (var el = parent; el && el !== main.parentNode; el = el.parentElement) {
        if (cand.has(el) && left < cand.get(el)) cand.set(el, left);
      }
    }

    var out = [];
    cand.forEach(function (ink, el) { if (ink !== Infinity) out.push({ el: el, ink: ink }); });
    return out;
  }

  function placeRail(nav) {
    var blocks = blockInk();
    if (!blocks.length) return;
    var docH = Math.max(1, document.documentElement.scrollHeight);
    /* Ink is viewport-relative and measured at scroll 0; a half-width about the page
       centre is what survives a resize. Vertical extent is in document coordinates. */
    var mid0 = window.innerWidth / 2;
    blocks.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      b.half = mid0 - b.ink;
      b.top = r.top + window.scrollY;
      b.bottom = b.top + r.height;
    });

    var observer = null;
    /* A SET, NOT A COUNTER, and the difference is a real bug this had. An
       IntersectionObserver's FIRST callback reports every target it was given,
       intersecting or not — so `blocking += isIntersecting ? 1 : -1` opened at
       1 - 18 = -17 on aurora-playlist.html, clamped to zero, and the one blocker
       that was genuinely level with the rail (a 1040px-wide gradient headline) was
       cancelled out by the eighteen that were not. The rail stayed up and the title
       ran straight through it. Membership is the question; count it as membership. */
    var active = new Set();

    var apply = function () {
      nav.classList.add('ss-rail-fits');            // so it has a layout width to read
      var railW = nav.getBoundingClientRect().width || 160;
      var room = window.innerWidth / 2 - RAIL_GAP - railW - RAIL_EDGE;

      var ok = blocks.filter(function (b) { return b.half <= room; });
      var wide = blocks.filter(function (b) { return b.half > room; });

      /* A WIDE REGION IS NOT THE SAME THING AS A PAGE THAT DOES NOT FIT, and telling
         them apart is the whole of this. On a Sound rack the essay clears the rail
         and the 1040px rack does not, so the rail rides beside the essay and steps
         aside for the cards — which is what this is for. But on print-design.html at
         1200px the page's OWN column is about ten pixels too wide, so nearly every
         block is "wide" and the rail blinked in and out all the way down the page,
         once per paragraph. Ryan caught that in a browser with a sidebar open.

         So: measure how much of the document the rail could actually stay up for. If
         the wide blocks cover most of it, this is not a page with a wide region in
         it, it is a page with no room, and the honest answer is no rail at all —
         which is what that page did before any of this. */
      var blocked = 0;
      if (wide.length) {
        var spans = wide.map(function (b) { return [b.top, b.bottom]; })
                        .sort(function (a, b) { return a[0] - b[0]; });
        var s0 = spans[0][0], e0 = spans[0][1];
        for (var i = 1; i < spans.length; i++) {
          if (spans[i][0] <= e0) { if (spans[i][1] > e0) e0 = spans[i][1]; }
          else { blocked += e0 - s0; s0 = spans[i][0]; e0 = spans[i][1]; }
        }
        blocked += e0 - s0;
      }
      var visibleFraction = 1 - Math.min(1, blocked / docH);

      if (!ok.length || visibleFraction < 0.35) {
        if (observer) { observer.disconnect(); observer = null; active.clear(); }
        nav.classList.remove('ss-rail-fits');
        nav.classList.remove('ss-rail-hidden');
        return;
      }

      var half = Math.max.apply(null, ok.map(function (b) { return b.half; }));
      nav.style.left = Math.round(window.innerWidth / 2 - half - RAIL_GAP - railW) + 'px';

      if (observer) { observer.disconnect(); observer = null; }
      active.clear();
      nav.classList.remove('ss-rail-hidden');
      if (!wide.length) return;

      /* Watch only the rail's own band. The rail is vertically centred, so a wide
         block scrolling past the top of the window is not in its way; one level with
         it is. rootMargin trims the viewport down to the rail's own extent. */
      var railH = nav.getBoundingClientRect().height;
      var trim = Math.max(0, Math.round((window.innerHeight - railH) / 2));
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) active.add(e.target); else active.delete(e.target);
        });
        nav.classList.toggle('ss-rail-hidden', active.size > 0);
      }, { rootMargin: (-trim) + 'px 0px ' + (-trim) + 'px 0px', threshold: 0 });
      wide.forEach(function (b) { observer.observe(b.el); });
    };

    apply();
    var queued = false;
    window.addEventListener('resize', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; apply(); });
    });
  }

  /* ---------- init ---------- */
  function init() {
    /* FIRST: buildFooterNav() and bindOwnPager() both return early unless
       window.changePage is a function, so the pager has to exist before them. */
    installPager();
    buildFooterNav();
    bindOwnPager();
    setupDeepLinks();
    setupEntryDeepLinks();
    buildRail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
