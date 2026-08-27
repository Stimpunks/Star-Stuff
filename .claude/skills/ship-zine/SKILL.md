---
name: ship-zine
description: Publish a Star-Stuff zine change end to end. Use when Ryan says "ship it", "ship it for me", "commit and push", or otherwise signals a change is ready to go live. Verifies the render, wires the zine into index.html / sitemap.xml / prev-next nav, updates FACTCHECK.md and changelog.html, then commits and pushes.
---

# ship-zine

Ryan's shorthand for "finish and publish." Scope depends on what changed.

## New or restructured zine (full pipeline)
1. **Verify the render.** Serve locally (`python3 -m http.server <port>`) and open the zine
   in the browser. Check every `id="spread-N"` renders, the prev/next nav works, and the
   print view looks right. Stop the server when done.
2. **Wire it into the site.**
   - Add/adjust the zine's entry in `index.html`.
   - Add its URL to `sitemap.xml`.
   - Fix `ss-nav-prev` / `ss-nav-next` `href`s on the neighbouring zines so the ring stays intact.
3. **Fact-check + ledger.** Verify any factual claims and coinages (see the `credit-source`
   skill), then add/update the zine's entry in `FACTCHECK.md` (claims → sources → credits).
   If a check found an error living **outside this repo** — in SKS or on stimpunks.org — record
   those paths in the ledger as `Open` rather than fixing them from here, and say so in the
   changelog rather than waiting to announce the error alongside its fix.
4. **Log it publicly.** Add an entry to `changelog.html` (see *Changelog* below).
5. **Rebuild the search index.** Any change to page *text* makes `search-index.json` stale —
   new pieces become unfindable and old results point at spreads that moved:

   ```bash
   node tools/build-search-index.mjs
   ```

   Commit the regenerated JSON with the rest. `--check` exits non-zero if it's stale.
6. **Measure contrast, on screen and on paper.** Don't assert that it prints — measure it:

   ```bash
   node tools/check-contrast.mjs --check <the-changed-pages>.html
   ```

   Composites every text element — and every SVG label, since `color` never reaches `fill` —
   against its real background, on screen and under print emulation. `--check` exits non-zero on
   any failure. Run it on the changed pages at minimum; bare, it sweeps the whole repo. If it
   reports a failure, fix the page, or say plainly in the report that you're shipping a known one.
   `CLAUDE.md` → *Contrast & print checking* explains each tier of the output.
7. **Check the markup.** Cheapest gate here — no browser, no dependencies, ~0.3s for the repo:

   ```bash
   node tools/check-markup.mjs --check
   ```

   Catches the faults the browser silently repairs, which is why nothing else sees them: nested
   `<a>`/`<button>`, a block element inside a `<p>`, and duplicate `id`s. A nested anchor makes the
   parser close the outer element early — it took a card grid apart on a live page while contrast,
   the search index and the eye of the person who wrote it all passed. **Baseline is 0**, so any
   failure here is yours and should be fixed rather than noted.
8. **Check the sitemap.** Also browser-free and instant, and it must be run whenever a page is
   added, renamed or removed:

   ```bash
   node tools/check-sitemap.mjs --check
   ```

   Audits the whole file rather than just your addition: missing entries, stale ones, duplicates,
   off-site `loc`s, malformed structure, the bare root entry `index.html` depends on, and `lastmod`
   sanity. **Baseline is 0.** It exists because a live zine sat unlisted for three weeks and a
   broadside was listed twice, and no other gate could see either — the four page-level checks all
   pass on a page that the sitemap has simply never heard of.
9. **Check card order if you added, moved or removed a card.**

   ```bash
   node tools/check-card-order.mjs --check
   ```

   Inside each grid, numbered cards must ascend within their own series. **Baseline is 0.** It
   exists because a card in the wrong place misreports where a collection ends — the prev/next
   chain follows collection order, so a misplaced card makes the chain look as though it stops a
   piece early, and a new zine gets wired into the middle of the collection. `check-markup.mjs`
   cannot see it: it derives membership from card *hrefs*, and a set has no order. Browser-free
   and instant, like the two above.

10. **If you touched a broadside, check it still fits the paper.**

   ```bash
   node tools/check-sheets.mjs --check
   ```

   Prints each sheet at US Letter *and* A4 and counts pages, and separately measures overflow —
   a fixed-height sheet that overruns is clipped, not paginated, so a clean page count can still
   hide a cut-off line. Only applies to pages with an `@page` rule.
11. **Commit & push.** `git add` the touched files; commit with a descriptive heredoc message;
   `git push`.

## Small edit (fast path)
Fact-check the touched claims → log it in `changelog.html` if it changes what a piece *claims*
→ **rebuild the search index if any page text changed** (`node tools/build-search-index.mjs`)
→ **check contrast if you touched a color, an opacity, or an SVG label**
(`node tools/check-contrast.mjs --check <page>.html`)
→ **run `node tools/check-card-order.mjs --check` if a card moved**
→ **always run `node tools/check-markup.mjs --check`** — it costs 0.3s, needs no browser, and its
baseline is 0, so there is no reason to skip it on any edit that touched HTML
→ `git add` → commit → `git push`. Don't re-propose or widen scope.

## Changelog

`changelog.html` is public at <https://starstuff.earth/changelog> and is the reader-facing
companion to `FACTCHECK.md`'s ledger. Three kinds of change get an entry; typo and styling
passes do not.

- Newest date section goes **first**, right after the tag legend. Reuse the existing markup:
  a `<section class="release" id="YYYY-MM-DD">` with a `.release-date`, a `.release-title`
  (and matching `id="h-YYYY-MM-DD"` on it for `aria-labelledby`), an optional `.release-note`,
  then one `.entry` per change.
- Each entry pairs a modifier class with its tag chip — `entry--new` / `tag--new` (new piece),
  `entry--updated` / `tag--updated` (substantial revision), `entry--factcheck` /
  `tag--factcheck` (audit or correction), `entry--site` / `tag--site` (site-wide work).
- **Name the correction, don't soften it.** Say what we got wrong, what's right, and who caught
  it. Publishing our own errors is the point of the page.
- Link the affected pieces with relative `href`s, and bump the `lastmod` on the changelog's
  `sitemap.xml` row.

## Rules
- Never invent that something renders — actually open it in the browser first.
- If a Netlify deploy later fails with `Permission denied (publickey)` / "Could not read from
  remote", that's infra (Netlify can't clone the repo), **not** a code bug — flag it to Ryan
  to reconnect the repo / deploy key rather than editing files.
- Keep the browser-paged view and the `@media print` / `@page` rules in `starstuff.css` in sync.
- **Print before shipping.** Browsers omit background graphics by default, so a page that
  doesn't invert for print goes to paper blank. New pages get the inversion free *only* if they
  alias the `--sp-*` tokens rather than hardcoding hexes.
- **`search-index.json` is generated, never hand-edited.** If it conflicts in a merge, rerun
  the generator rather than resolving the JSON by hand.

_Draft scaffolded from session history — refine against the repo's actual conventions._
