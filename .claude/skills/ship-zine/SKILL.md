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
4. **Log it publicly.** Add an entry to `changelog.html` (see *Changelog* below).
5. **Commit & push.** `git add` the touched files; commit with a descriptive heredoc message;
   `git push`.

## Small edit (fast path)
Fact-check the touched claims → log it in `changelog.html` if it changes what a piece *claims*
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

_Draft scaffolded from session history — refine against the repo's actual conventions._
