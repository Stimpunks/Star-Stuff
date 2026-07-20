/* Star Stuff — shared front-end behaviors
   =================================================================
   Two features, both driven entirely from this shared file so that
   every paged zine inherits them just by including <script src="starstuff.js">:

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

  /* ---------- init ---------- */
  function init() {
    buildFooterNav();
    setupDeepLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
