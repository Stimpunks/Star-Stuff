/* Star Stuff — shared front-end behaviors
   -----------------------------------------------------------------
   Per-spread footer navigation.

   Adds "‹ prev" and "next ›" controls to the bottom of every paged
   zine spread, so a reader who has just finished a spread can move on
   without scrolling back up to the top nav. The controls reuse each
   spread's existing .spread-footer bar and hook into the page's own
   global changePage() function, so there is no new navigation logic to
   keep in sync — this file only wires up the buttons.

   Safe to include on any page: it is a no-op unless the page has a
   changePage() function plus .spread / .spread-footer elements. */
(function () {
  'use strict';

  function buildFooterNav() {
    if (typeof window.changePage !== 'function') return;

    var spreads = Array.prototype.slice.call(document.querySelectorAll('.spread'));
    var footers = document.querySelectorAll('.spread-footer');
    if (!spreads.length || !footers.length) return;

    var lastIndex = spreads.length - 1;

    footers.forEach(function (footer) {
      if (footer.querySelector('.spread-footer-nav')) return; // already wired — stay idempotent

      var spread = footer.closest('.spread');
      var index = spreads.indexOf(spread);

      var nav = document.createElement('span');
      nav.className = 'spread-footer-nav';

      var prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'spread-nav-btn prev';
      prev.setAttribute('aria-label', 'Previous spread');
      prev.textContent = '\u2039 prev';
      prev.addEventListener('click', function () { window.changePage(-1); });
      if (index <= 0) prev.disabled = true; // no earlier spread to go to

      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'spread-nav-btn next';
      next.setAttribute('aria-label', 'Next spread');
      next.textContent = 'next \u203a';
      next.addEventListener('click', function () { window.changePage(1); });
      if (index === lastIndex) next.disabled = true; // end of the zine

      // Relocate the existing page number into the middle of the cluster,
      // so the footer reads: [ title ................ ‹ prev  N  next › ]
      var counter = footer.querySelector('.spread-footer-right');

      nav.appendChild(prev);
      if (counter) nav.appendChild(counter);
      nav.appendChild(next);
      footer.appendChild(nav);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFooterNav);
  } else {
    buildFooterNav();
  }
})();
