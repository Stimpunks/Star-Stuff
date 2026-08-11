# DECISIONS.md — Star Stuff

A running log of decisions about the Star Stuff collection: things settled, things still
open. Newest at the top of each section. This is a working doc, not published — it's for us.

For *why the project exists* and *how pages are built*, see [CLAUDE.md](CLAUDE.md). This file
only tracks **choices** — what we decided, and what we still have to.

---

## Open

Decisions still to make. Move to **Settled** with a date once resolved.

- _(collections + numbering resolved 2026-08-11 — see Settled)_
- **No. 37 *The Cloud Phase* — blocked on asking Helen, 2026-08-11.** Proposed and scoped; not
  built. Everything below is decided *except* the credit, which needs her word first.
  - **Direction settled.** Title **The Cloud Phase** — astronomy's own term for the last stage of a
    supernova remnant (Romano, Behrendt & Burkert, *ApJ* 965, 168, 2024), which already reads as a
    life stage. Collection **Star Stuff** (the fact carries the claim). Nine spreads.
  - **The spine is Murray (2011), *ApJ* 729, 133**, not the 2024 paper: εGMC 0.002–0.2,
    luminosity-weighted mean **0.08**; GMC lifetimes **27 ± 12 Myr**. So ~92% of a molecular cloud
    never becomes a star, and the cloud stage lasts tens of millions of years. *The refusal to
    rush the metaphor to resolution is not editorial restraint here — it is what the data says.*
    The in-between is the majority condition and the long one.
  - **Romano et al. is a marked proposal, not the spine.** It is the best image in the piece — the
    remnant's cold shell *implodes back inward* and settles into a chemically enriched cloud of
    10³–10⁴ M☉, "an attractive, novel pathway for supernova induced star and planet formation" —
    and it is a 2024 simulation, not consensus. Hedge it in place on spread 2, wood-wide-web style.
    If it is ever overturned, the zine's centre does not move.
  - **Ask Helen before building.** Two of the twenty constellations in *My Monotropic Galaxy*
    (More Realms, 2026) are load-bearing here — **Supernova Remnant** (#2, explicitly the *after*
    of burnout) and **Emergence Point** (#20) — and she already has **two nebulae** in that index,
    Tunnelling Nebula (#4) and Limerence Nebula (#18). A nebula zine walks into her naming, not
    near it. Default credit is house-authored **"after Helen Edgar"** (the No. 29 shape); if she
    would rather write it, it becomes a guest zine in her voice and spreads 6–8 change.
  - **Do not re-argue No. 20 *The Same Water*.** It already owns weather-bodies, fluid adaptation,
    and "capacity is a state, not a trait" — and the Jeans instability. No. 37's distinct territory
    is **duration**: the in-between as the majority state, not a threshold crossing.
  - **Spent elsewhere, don't repeat:** "failed star" (Field Guide No. 5, brown dwarfs as the
    named-for-a-lack case); SN 1006 as seed-head (No. 18); Orion as nursery (Constellation FG).
- **Promote "Science and wonder and the beautiful diversity of being" to the masthead too?**
  Shipped 2026-08-11 as the **Collections section lede** on `index.html`, where its three clauses
  name the three largest collections. Still open whether it also belongs in `.masthead-sub`.
  "Cosmic Connections" stays the tagline either way — Helen's phrase, fixed brand element.
- **Per-piece collection badges?** A reader landing on a zine from search has no on-page signal
  which collection it belongs to. Deliberately skipped in the 2026-08-11 pass: the `.cover-issue`
  slot is tracked-out uppercase in a tight measure (the documented 455px-in-280px trap), so it
  needs measuring before anything is added, and the prev/next chain plus the collection pages
  already carry the browse story. Revisit if readers ask "where am I?"
- ~~**Sort the collection into named collections.**~~ **Settled 2026-08-11.** Retained below for
  the reasoning, which is the part worth keeping.
  - **Renumber? Decided: no.** The number records *when a piece was made*; the collection
    records *what it is*. Keep them orthogonal. Renumbering would (a) falsify `changelog.html`,
    which has dated public entries naming numbers — this site publishes its own corrections, so it
    cannot quietly rewrite its own history; (b) break the `FACTCHECK.md` ledger, which is a table
    keyed by number with cross-references *by number* in the prose ("counter-song to Bone Song (1)",
    "same shape of fact as No. 31's decarcinization"); (c) invalidate every external reference,
    including Helen's essays on More Realms — slugs are stable, but a number quoted in prose has no
    redirect. Chronological numbering is also the *evidence* that the categories emerged rather than
    being imposed, which is the claim `cosmic-connections.html` makes.
  - **Collections are pages, not folders.** `cosmic-connections.html` commits to "the categories are
    outputs, not inputs" — links over folders. That is an argument *for* naming these now: 35 zines
    were written with no folders, and the clusters were observed afterward. Give each collection a
    real landing page that lists its members and says why they belong together — a note that links,
    not a directory. Also required for findability: `tools/build-search-index.mjs` strips
    `.card-series` and `.cover-issue` as chrome, so a collection name placed only in those slots
    would be **unsearchable**.
  - **Proposed five collections + the Field Guides as an untouched series (all 35 zines assigned):**
    - **Star Stuff** — the founding register: one settled, checkable fact, followed honestly,
      already contains the belonging claim. 1, 2, 6, 7, 8, 9, 10, 17, 19, 20, 21, 23, 24, 25,
      plus the proposed new physics set. Note 17/19/20/21/25 read as "later drift" by date but are
      squarely in the founding register by mechanism (tidal force ∝ 1/d³, relativistic clocks,
      phase transitions, real spectra, the EM field). Keeps the declared 23–24–25 triptych intact.
    - **Star Gazing** (Helen's name) — experimental, neuroqueer, wonder-forward; possibility rather
      than proof. 11 (the hinge), 22, 26, 28, 29, 30, plus any superposition/scintillation pieces.
    - **More Than Human** — Umwelt, multispecies, ethodiversity; the de-anthropocentrized strand.
      5, 14, 15, 16, 27. Keeps 14–15–16, which No. 16 itself calls "a loose trilogy," contiguous.
    - **Kin** — citation-dense natural history and psychology with a neurodivergence moral: our
      relatives, and the reflexes that make us disown them. 31, 32, 33, 34, 35. Sibling to Field
      Guides 9/10/11. **Do not name this "Ways of Being"** — it collides with Field Guide No. 5,
      *A Field Guide to the Ways of Being a Star*.
    - **Stars We Grew Up On** — culture and icon; owns the star-as-celebrity pun instead of letting
      it read as drift. 12, 13, plus `ls-playlist.html` and `ls-broadside.html`.
  - **Three "zines" are not reading-collection essays** and should move out of the numbered essay
    run (numbers retained): **3** Neurodiversity Field Guide is a paradigm primer → Foundations;
    **4** We Are All Star Stuff is an open call for contributors → Start Here / Take Part;
    **18** The Garden and the Stars is a self-portrait of the project → Foundations/Notes, sibling
    to `cosmic-connections.html`.
  - **No "For Fun" collection.** A bin labelled for fun implicitly labels the rest homework, and —
    the real risk — creates the one place where the verify-everything standard could quietly relax.
    Fun is distributed: it is already the whole point of Stars We Grew Up On and of Kin.
  - **Open sub-question:** whether prev/next is rewritten to follow collection order (makes the
    collections real for a reader navigating by footer nav; ~54 files, scriptable) or left in
    chronological order (cheaper, but "next" keeps crossing collections).
- **Promote "Science and wonder and the beautiful diversity of being" to the front page?**
  Ryan's phrase, endorsed by Helen. Recommendation: **yes, but as the intro lede, not the tagline** —
  "Cosmic Connections" is Helen's and is a fixed brand element per CLAUDE.md. The phrase's three
  clauses already map onto the three largest proposed collections (science → Star Stuff, wonder →
  Star Gazing, the beautiful diversity of being → More Than Human + Kin), which makes it the
  natural lede *for the collections section* rather than a replacement masthead tagline.
- **Extract design tokens + starfield into `starstuff.css`?** They still live inline in every
  page. Moving them to the shared stylesheet single-sources them but breaks each page's total
  self-containment. Decide whether the DRY win is worth the coupling. (Flagged in CLAUDE.md.)
- _(license decision resolved 2026-07-21 — see Settled)_

---

## Settled

Decisions already made, with a one-line why. Backfilled from git history — dates are first
commit evidence, not necessarily when the call was made.

- **2026-08-11 — Five collections, and no renumbering.** The 35 zines are sorted into **Star Stuff**
  (founding register), **Star Gazing** (Helen's name; experimental/neuroqueer), **More Than Human**
  (de-anthropocentrized), **Kin** (natural history), and **Stars We Grew Up On** (culture) — plus the
  Field Guides, untouched as their own series. Membership is by **register, not chronology**, which
  moved Nos. 17, 19, 20, 21 and 25 into the founding collection where they read as later drift by
  date. Nos. 3, 4 and 18 left the essay run entirely (paradigm primer → Foundations, open call →
  Start Here, project self-portrait → Foundations), keeping their numbers. **Numbers were not
  touched**: the number says *when*, the collection says *what*, and renumbering would have
  falsified the dated public changelog, broken the number-keyed `FACTCHECK.md` cross-references, and
  invalidated every reference in prose, which has no redirect. Each collection is a **page, not a
  folder** — a note that links, so the taxonomy stays inside the web rather than above it, per
  `cosmic-connections.html`. The prev/next chain was rewritten to follow collection order (57 pages,
  verified). Rejected along the way: a **"For Fun" collection** — a bin labelled for fun implicitly
  labels everything else homework, and would become the one place the verify-everything standard
  could relax; the fun is distributed instead, and *Stars We Grew Up On* says so on its face. Also
  rejected: **"Ways of Being"** as the name for Kin, which collides with Field Guide No. 5.
- **2026-07-21 — License: CC BY-SA 4.0, applied to the whole collection.** Dropped the earlier
  `NC` (commercial use allowed). Chose BY-SA over CC0 so attribution and share-alike hold —
  credit stays with Stimpunks, and derivatives must stay open, matching the anti-enclosure ethos.
  Added a full `LICENSE` file and a visible `rel="license"` link in every page footer.
  Applied as a **blanket** license including guest-authored pieces (Helen Edgar's guest zine,
  coda, and essay summary), per owner's decision — noting those carry their own `©` notices.
  CC0 remains a possible future loosening (see Parked).
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

- **Loosen to CC0 later?** BY-SA → CC0 is the easy direction and ours to make as rights holder;
  the catch is guest-contributed portions, which need each author's sign-off before CC0 (it
  waives attribution, which BY-SA preserves). Our own work can go CC0 anytime.
