# DECISIONS.md — Star Stuff

A running log of decisions about the Star Stuff collection: things settled, things still
open. Newest at the top of each section. This is a working doc, not published — it's for us.

For *why the project exists* and *how pages are built*, see [CLAUDE.md](CLAUDE.md). This file
only tracks **choices** — what we decided, and what we still have to.

---

## Open

Decisions still to make. Move to **Settled** with a date once resolved.

- **Extract design tokens + starfield into `starstuff.css`?** They still live inline in every
  page. Moving them to the shared stylesheet single-sources them but breaks each page's total
  self-containment. Decide whether the DRY win is worth the coupling. (Flagged in CLAUDE.md.)
- **Add a `LICENSE` file?** Intent is an open edition — print free, share freely. CC BY-NC-SA
  fits, but no `LICENSE` file exists yet. Decide whether to make terms explicit in-repo.

---

## Settled

Decisions already made, with a one-line why. Backfilled from git history — dates are first
commit evidence, not necessarily when the call was made.

- **2026-07-20 — Persistent About in the shared nav.** `ss-nav` carries a home+about pill
  cluster on every page, so the collection's framing is one click away from anywhere.
- **2026-07-20 — Per-spread footer nav + `#spread-N` deep links.** Paged zines get prev/next
  footer controls and shareable per-spread anchors, driven by shared `starstuff.js`.
- **2026-07-18 — Single-source shared assets (`starstuff.css` / `starstuff.js`).** Nav and
  paged-zine behavior live in shared files linked by relative URL, not copied per page.
- **2026-07-18 — Shared `ss-nav`; drop WordPress self-containment.** One nav component,
  tinted per page via `--nav-accent`, chaining the collection into a reading order.
- **2026-07-18 — Full social metadata on every page.** Canonical URL, Open Graph + Twitter
  cards (1200×630 `og-card.jpg`), and JSON-LD `Article` schema attributing Stimpunks.
- **2026-07-18 — Accessibility + print as defaults.** `prefers-reduced-motion` honored,
  reduced-motion/favicon/sitemap/robots baseline site-wide; artifacts stay print-friendly.
- **2026-07-18 — First-person plural for the community; they/them for individuals.** We write
  from within (we/us/our), and don't infer anyone's pronouns from a name (e.g. Tarragnat).
- **2026-07-18 — Rationale pages sit outside the reading chain.** The Difference-First Frame
  is linked from index Notes, not threaded into prev/next — backing material, not a stop.
- **2026-07-17 — Ethodiversity nests as biodiversity ⊃ ethodiversity ⊃ neurodiversity.**
  De-anthropocentrized per Tarragnat; the "chorus" image (ways of being), not "rainforest".
- **(pre-log) — Git repo is the source of truth; deploy by push to `main` via Netlify.** No
  build step, static files served as-is. The stale Netlify/Drive folder is ignored.
- **(pre-log) — Every artifact is one self-contained HTML file.** No dependencies beyond
  Google fonts; each reachable at its own path.
- **(pre-log) — The register table is canonical.** LYDTYSS / LYSS / LUSS / L★S / ★stuff, each
  with a fixed register and use (see CLAUDE.md).
- **(pre-log) — Keep the two Cavendish senses distinct.** The banana is the monoculture
  problem; Cavendish Space is the built-for-diversity answer. Never conflate them.

---

## Parked

Ideas deferred, not rejected — revisit later.

- _(none yet)_
