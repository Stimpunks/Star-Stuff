# CLAUDE.md — Star Stuff

Guidance for Claude Code working in this repository.

## What this project is

**Star Stuff** (live at **https://starstuff.earth/**) is a collection of printable, shareable
web artifacts — an official collaboration between the **Stimpunks Foundation** and **More Realms**
(https://morerealms.com/), Helen Edgar's site. It is a family of self-contained HTML zines, field
guides, and broadsides built around one idea, stated as an act of love: *the universe doesn't
pathologize its own variation.*

The framing braids two threads: Carl Sagan's cosmology (the atoms in your body were forged in
dying stars — you are, literally, star stuff) and Dr. Iwao Yasuda's 1950s finding that bone is
*piezoelectric* (your skeleton turns pressure into charge). Read through the neurodiversity
paradigm, the through-line is that difference is variation, not deficit.

**Tagline: *Cosmic Connections*** — Helen Edgar's phrase, on the `index.html` masthead
(`.masthead-tagline`, plain text under the wordmark) with the argument at
`cosmic-connections.html`, filed in *Start Here*. It names the house method: interdisciplinary,
iterative, emergent, built out of each other's work. Two lineages sit inside it — James Burke's
*Connections* (BBC, 1978) and Carl Sagan's *The Cosmic Connection* (1973) — and both must stay
credited wherever the phrase is explained. Don't reword the tagline; it is a brand element.

The central phrase compresses through registers, each with a use:

| Form | Register | Use |
|------|----------|-----|
| **LYDTYSS** | full | Love You Down To Your Star Stuff |
| **LYSS** | tender | the quiet, intimate form |
| **LUSS** | punk | the loud, defiant form |
| **L★S** | visual | the logotype / mark |
| **★stuff** | reclamatory | the noun, taken back |

## Source of truth & deployment

- **This git repo IS the source of truth.** It is cloned at `~/Documents/GitHub/Star-Stuff`.
- Pushing to `main` deploys to https://starstuff.earth/ via **Netlify**. Static files, **no build
  step** — Netlify serves them as-is.
- There is a stale Netlify/Google Drive folder floating around. **Ignore it.** Edit here, push here.
- **After editing files, always finish by giving the user the git commands** to ship the change:

  ```bash
  git add <files>
  git commit -m "<message>"
  git push
  ```

## Architecture

- Every artifact is a **single self-contained HTML file** with no dependencies beyond Google web
  fonts. Each is reachable at its own path (e.g. `https://starstuff.earth/bone-song-zine.html`).
- `index.html` is the landing page and entry point.
- Two shared assets, included by pages via **relative URLs**:
  - **`starstuff.css`** — shared site navigation (`.ss-nav`), the injected per-spread footer nav
    styles, the **canonical palette tokens** (`--sp-*`, the single source of truth for recurring
    colors), and the shared **`@keyframes twinkle-anim`**. Each page's inline `:root` aliases
    (`--purple`, `--violet`, `--void`, …) point at the `--sp-*` tokens via `var()`, so a palette
    change happens here, once. Page-specific one-off colors still live inline per page, and the
    **themed starfield gradient art stays inline by design** — its per-page tinting (cyan for
    water, green for aurora, warm-white for bone) is intentional, not duplication.
  - **`starstuff.js`** — shared front-end behavior for paged zines: per-spread footer prev/next
    controls and `#spread-N` deep linking. It is a safe no-op on pages that aren't paged zines
    (i.e. pages lacking a global `changePage()` plus `.spread` / `.spread-footer` elements).
- Supporting files: `favicon.svg`, `og-card.jpg`, shared cosmic image
  `35407642044_c29b4f2bd7_3k.jpg`, `robots.txt`, `sitemap.xml`.
- `changelog.html` is the **public changelog**, live at https://starstuff.earth/changelog (Netlify
  serves clean URLs, so the `.html` file answers at both paths; keep internal links, canonical, and
  the sitemap on `changelog.html` like every other page). It is the reader-facing companion to
  `FACTCHECK.md` — see *Fact-checking & attribution* below for what to log there.

### Page conventions (treat every page this way)

- **Relative URLs** for internal links and assets (`href="index.html"`, `href="starstuff.css"`).
- Link the shared stylesheet: `<link rel="stylesheet" href="starstuff.css">`.
- Use the shared **`.ss-nav`** nav component. Each page tints it by setting `--nav-accent` on the
  `.ss-nav` element. The nav has a left home-group (`index.html` + `about.html` pills) and
  prev/next links that chain the collection into a reading order. Example:

  ```html
  <nav class="ss-nav" style="--nav-accent:#fbbf24;" aria-label="Star Stuff collection">
    <span class="ss-nav-home-group">
      <a class="ss-nav-home" href="index.html"><span class="ss-star" aria-hidden="true">★</span> stuff</a>
      <a class="ss-nav-about" href="about.html">about</a>
    </span>
    <span class="ss-nav-links">
      <a class="ss-nav-prev" href="PREV.html"><span class="ss-nav-arrow" aria-hidden="true">‹</span> <span class="ss-nav-label">Prev Title</span></a>
      <a class="ss-nav-next" href="NEXT.html"><span class="ss-nav-label">Next Title</span> <span class="ss-nav-arrow" aria-hidden="true">›</span></a>
    </span>
  </nav>
  ```

  Full-bleed pages add `ss-nav--bleed` for edge padding. Use `.ss-nav-label` for destination
  names (auto-hidden on narrow screens; arrows remain).
- **Every collection member carries a `.ss-nav-collection` badge**, the last child of `.ss-nav`,
  answering *where am I?* for the reader who arrived from search rather than the index:

  ```html
  <a class="ss-nav-collection" href="collection-kin.html"><span class="ss-nav-collection-label">Collection</span> <span class="ss-nav-collection-name">Kin</span> <span class="ss-nav-arrow" aria-hidden="true">&rsaquo;</span></a>
  ```

  All 125 members have one; the 13 collection pages, `index.html` and `search.html` do not (125 +
  13 + 2 = the 140 pages in the repo root). **A new
  piece needs its badge and its collection page's card in the same pass** — the page→collection map
  is derived from `<a class="card" href="…">` on the collection pages, so a card that is missing
  makes the badge underivable. **`tools/check-markup.mjs` enforces all of this as of 2026-08-13**
  — both directions, plus the badge's placement, target and label — so don't rely on remembering
  it; four pages went without a badge until a reader noticed. It sits **inside** the nav
  deliberately: that is what gives it the
  print hide and the `CHROME_SEL` strip for free, and the strip is required — see *Search* below on
  why collection names must not become a discoverability crutch. It takes its own row
  (`flex-basis:100%`), which is measured, not stylistic; the reasoning and the rejected
  alternatives are in `DECISIONS.md`.
- Include full head metadata like the existing pages: canonical URL, description, Open Graph +
  Twitter card tags pointing at `og-card.jpg` (1200×630), and JSON-LD `Article` schema. Two fixed
  values: `og:site_name` is `Star Stuff · Stimpunks Foundation × More Realms`, and `publisher` is an
  **array of both organizations** — Stimpunks Foundation (`https://stimpunks.org/`, with the
  `og-card.jpg` logo) then More Realms (`https://morerealms.com/`). See *Co-branding* below.
- **Use real headings, with ids.** A section label must be an `<h1>`/`<h2>`, not a styled `<span>`
  — a screen reader's headings rotor *is* the table of contents, and `index.html` shipped with
  **zero heading elements** until 2026-08-12, so that list came back empty on the landing page of
  an accessibility-first site. Nothing on it could be deep-linked either. The house classes already
  set size, weight, tracking and color, so the swap is a tag change plus `margin: 0` and a
  `scroll-margin-top`. `tools/check-markup.mjs` guards the ids for duplicates; nothing guards their
  existence, so this is on you.
- `index.html` carries a **`.masthead-toc` jump strip** — two `<ul>` tiers, thirteen pills: seven
  top-level sections (Start Here, Foundations, Collections, Field Guides, Sound, Print, Notes) then
  the six that get their own grid section — the five register collections plus **How We Got Here**,
  which joined the lower tier rather than the upper one. Each is tinted with the same `--sec-accent`
  its heading and rule carry. **A new top-level section on the index needs a pill here**, and the strip is in
  `CHROME_SEL` (its names are already indexed as the headings they point at) and hidden in
  `@media print` (fragments mean nothing on paper, and the hardcoded accents would land at 1.6:1
  on white).
- **An index card is three elements, and the disclosure is a *sibling* of the link, never a child.**
  `.card-wrap` draws the box and the accent rule (and carries `--card-color`); `<a class="card">` sits inside it
  with the number, title, series, **`.card-tagline`**, `.card-desc` and footer; the `<details class="card-details">`
  follows the anchor as its sibling. **`<a>` may not contain interactive content and `<summary>` is interactive**,
  so a toggle inside the anchor is the `collection-print.html` nested-anchor fault in a new costume — and
  **`check-markup.mjs` passes it clean, exit 0** (measured 2026-08-18: the nesting check matches `<a>`/`<button>`
  by name, and `details` only counts as a block element, which fires only inside a `<p>`). Nothing gates this;
  it is on you.
- **Seven collection pages already had a lead line — `.card-moment` — and the tagline must not
  restate it.** Easter Eggs, Field Guides, Foundations, Notes, Print, Sound and Start Here carry one
  on 62 cards, and it was doing the tagline's job before the tagline existed. Deriving both from the
  same page produced **eleven collisions, six of them verbatim** (`elements-field-guide` had the
  identical sentence twice). Nine were rewritten to say something the moment does not, which is why
  those nine differ from their own index taglines — the index has no `.card-moment`, so nothing
  collides there. Check with a word-set overlap between the two, not by eye; anything above ~60% is
  the same sentence wearing two styles.
- **The card structure is on all fourteen card-bearing pages** — `index.html` and the thirteen
  collection pages (2026-08-18). The CSS is *not* shared: each collection page keeps its own accent
  fallback (`var(--violet)`, `var(--cyan)`, `var(--accent)`) and its own hover tint, because the
  tinting is per collection on purpose. Derive those from the page rather than hardcoding them.
  **The membership map survives the wrapper** — `check-markup.mjs` reads `<a class="card" href>`,
  which the wrapper does not touch; verified at 103/103 badges after the change (125/125 as of 2026-08-28).
- **The tagline is the piece's own line, not a line written for the index.** Lift it verbatim from the page's
  `.cover-subtitle` — 63 of the 97 cards had one. The other 34 (every field guide, playlist and broadside) have
  no subtitle to lift, so theirs is drawn from what the page already argues. **A `Details` that merely restates
  the tagline and summary is not a Details** — after the 2026-08-18 split, eleven cards had disclosures adding
  under ten new words and four added *zero*; they were rewritten from their pages rather than deleted. Re-derive
  with the word-set difference between face and body before adding a card, not by eye.
- Paged zines: include `<script src="starstuff.js"></script>`, expose a global `changePage(dir)`,
  and structure spreads as `.spread` (with a `.spread.active`), each with a `.spread-footer`
  containing a `.spread-footer-right` page counter. IDs run `spread-1..N` in document order.
- **Scrolling zines are the second zine form, and the paged one is still the default (2026-08-26).**
  A scroll zine keeps `.spread` sections and `spread-1..N` ids and changes only how they are
  revealed: every section is laid out at once, one per screen, in a continuous channel. It needs
  **no** `changePage()` and **no** `.spread-footer` — `starstuff.js` no-ops without the former, and
  the gates all handle the form unchanged (contrast reveals `.active` harmlessly, the search index
  chunks on `[id^="spread-"]`). **Deep links improve**: native anchor scrolling reaches a passage
  with no JavaScript, where a paged zine needs `starstuff.js` to intercept the hash. **Reach for it
  only when the shape of the reading is part of the argument** — No. 68 is about a groove, so a
  furrow says something discrete spreads would contradict. **The one real cost is paper, and it has an exact cause:**
  `starstuff.css`'s print block sets `.spread { page-break-after: always }` — right for a paged
  zine, wrong here — so a scroll zine **must** reset `break-after: auto` on `.spread`, or it prints
  one sheet per section regardless of anything else it does. Measured on No. 68: **12 sheets before
  the reset, 8 after**, several of the twelve holding 180–600 characters. Removing the page's own
  `break-inside: avoid` changed nothing and looked like "no effect" — the wrong property. Also hide
  `.cover-scroll`; *scroll down* is not an instruction paper can carry out. **No gate can see any of
  it** — `check-contrast.mjs` measures print *colours*, not sheet counts, and `check-sheets.mjs`
  only applies to paper-first broadsides (it reports a scroll zine as `expected 0 sides`, which is
  the wrong tool rather than a failure). Count the sheets by hand, and read the characters-per-page
  spread, not just the total.
  Reasoning and the rejected shared-sheet option are in `DECISIONS.md`.

### Collections (thirteen pages, in three kinds plus one exception)

Thirteen **collection** landing pages (`collection-*.html`). **Every section of `index.html` has
one** — that is the invariant, so *a new index section owes a collection page*, and a new
collection page owes a `.collection-intro` on the index carrying its accent and an
`About this collection →` link. The five register collections were settled 2026-08-11 — see
`DECISIONS.md` for the reasoning; Print and Sound followed the same day, Field Guides on the 12th,
and Start Here, Foundations and Notes &amp; Rationale later on the 12th. **How We Got Here** joined
on the 12th as the twelfth, at two members — see *the two-member floor* below.

- **`collection-easter-eggs.html` is the one exception, and it inverts that invariant on purpose
  (2026-08-14).** It has **no section on the index** — that absence is the entire mechanism, since a
  listed egg is not off the path. Nothing in the tooling enforces index↔collection parity (the
  membership map is built from collection-page cards, never from the index), so this costs nothing
  mechanically, but **don't generalise it**: every other collection still owes its index section.
  It also **broke the two-member floor at one member**, which is recorded with its reasoning in
  `DECISIONS.md` rather than left to look like drift. The trade it bought: the alternative was a
  hand-written single-file exemption inside `check-markup.mjs`, and **a collection page is visible
  where a tool exemption is not.** An egg is *not a lower standard* — same sourcing, same grading,
  same `FACTCHECK.md` row, same changelog entry, same eight gates. Only the door moves. And eggs stay
  inside `sitemap.xml`, `search-index.json` and every gate, because a page the checks cannot see is
  a page that rots.

**Five sort by register** — what kind of argument a piece is making:

| Collection | Register | Members (zine numbers) |
|------------|----------|------------------------|
| **Star Stuff** | One settled, checkable fact, followed honestly, already contains the belonging claim | 1, 2, 6, 7, 8, 9, 10, 17, 19, 20, 21, 23, 24, 25, 44, 45, 46, 48, 51, 53, 54, 55, 57, 60, 61, 62, 63, 69, 70, 71 (30 — the largest collection by some way) |
| **Star Gazing** | Experimental, neuroqueer, wonder-forward — possibility, not proof | 11, 22, 26, 28, 29, 30, 68 |
| **More Than Human** | Umwelt, multispecies, ethodiversity; de-anthropocentrized | 5, 14, 15, 16, 27, 58, 59, 72 (8) |
| **Kin** | Citation-dense natural history with a neurodivergence moral | 31, 32, 33, 34, 35, 36, 64 (7) |
| **Stars We Grew Up On** | Culture and icon; owns the star-as-celebrity sense | 12, 13, 66, 67 (+ playlists, broadside in spirit) |

**Four do not**, and each says so on its own face rather than letting it read as an oversight —
that disclosure is the convention, and **How We Got Here duly carries it too**:

| Collection | Axis | Members |
|------------|------|---------|
| **Field Guides** | **form** — a catalogue of same-shaped entries, none ranked | Field Guides 1–12, 14–19 — 18 guides, **218 entries; 231 cards** (derived 2026-08-27). FG 13 is *not* here: it is the egg, `watching-animals-field-guide.html`. The thirteen cards that are deliberately **not** entries are the five *turtles people made* (FG 10), the octopus settlements (FG 14), the rooms people build (FG 15), the egg-crack accounts (FG 16), the two questions the answer is not in on yet (FG 17), the palaeontologist who was not a specimen and the corrections nobody has published yet (FG 18), and the families people make (FG 19) |
| **How We Got Here** | **form** — a Burke chain, one link per spread, joints marked | 38, 39, 40, 41, 42, 43, 50, 52, 56, 65 (10 chains) |
| **Print** | **medium** — paper | 9 broadsides + 2 that are not broadsides (a typographic specimen, and a blank sheet) |
| **Sound** | **medium** — audio | 7 racks, **230 song cards** — and the collection page deliberately prints *no* distinct-song total, which is the right call: five Bowie songs sit in two racks on purpose, and the Dolly rack's covers section gives "Jolene" eight cards and "I Will Always Love You" five, so "distinct songs" has no honest single answer. Derived figures, if you need them: 226 distinct song+artist pairs, 193 distinct titles. **Don't put a songs number back on the page.** |

- **Why the chains exist — reclaim science from the things that wear its clothes.** Ryan's framing,
  2026-08-12, and it is the collection's motive rather than a theme: **eugenics and behaviorism took
  good physics and misapplied it to human beings.** Three things get mistaken for science and are its
  opposite — **pseudo-science** (none of the method), **scientism** (the authority kept, the practice
  dropped: the *p*-value and "evidence-based" without pre-registration, blinding, reported harms or
  published nulls), and the **smoothed popular retelling** that files off every hedge because the
  tidy version travels further. Pointed at people, these flatten exactly the variation the science
  elsewhere insists is real, and they *[measure the surface, badly](https://stimpunks.org/2023/11/22/on-the-problems-with-science-of-reading/)*
  — producing epistemic injustice with a citation attached, which is much harder to answer than a
  plain insult. **So a chain here is never an argument against evidence; it is an argument for the
  parts left behind.** If a draft starts reading as anti-science, it has gone wrong. Stated on the
  collection page's face, and No. 40 is the piece that argues it outright.
- **How We Got Here has its own convention, and it is the point of the collection: every joint in
  a chain is marked `documented`, `contested` or `leap`** — in the prose *and* in the line style of
  the running spine at the foot of each spread. A Burke chain is built to feel inevitable, which
  collides head-on with *verify, don't assume*; the notation is how the form carries its own
  epistemics instead of a footnote doing it. **The tags only mean anything if the mix is real** —
  No. 38 runs six documented, three contested and one leap, with its own founding anecdote among the
  contested. Don't let a chain reach its conclusion across three leaps, and don't promote the
  notation to pieces outside this collection without a reason; see `DECISIONS.md`.
- **The two-member floor.** This collection was deliberately deferred when No. 38 shipped, on the
  *collections are outputs, not inputs* principle, and created the same day No. 39 arrived with the
  same shape. Two is the floor, not a shortcut — *Stars We Grew Up On* has carried two numbered
  zines since 2026-08-11. What earns a collection page is a **form observed in finished work**,
  never a folder opened in advance.

**Three are not sorted at all** — they are the site's own furniture, and the pieces in them were
never candidates for a register. Don't try to fold these into either table:

| Collection | What it is | Members |
|------------|-----------|---------|
| **Start Here** | the ways in | `about`, `love-you-down-to-your-star-stuff`, `cosmic-connections`, No. 4 — three doors in, one out |
| **Foundations** | what the rest presupposes | `manifesto`, `inclusion-safety-creed`, `too-good-to-check`, `who-is-holding-the-candle`, `a-promise-not-a-finding`, `starlight`, No. 3, No. 18 (8) |
| **Notes & Rationale** | the working papers | `changelog`, `design`, `print-design`, `difference-first-frame`, `the-ladder-we-dont-print` (5) |

- **Notes & Rationale is the only collection page outside the prev/next chain**, because all five
  of its members are. Threading a changelog or a design system into a reading sequence would put a
  maintenance document between two zines. Its `.ss-nav` therefore carries **only the home group**,
  no prev/next — the same shape `about.html` and `cosmic-connections.html` use. If a future
  collection's members all sit off the chain, copy that shape rather than inventing a link.
- **Field Guides sort by form, and that cuts across register on purpose.** FG 2 is settled physics
  and FG 1 is frank invention, and they are the same kind of object. Twelve of the eighteen arrive
  independently at *there is no standard {star, nervous system, migration, shark, turtle, tortoise,
  galaxy, amount of company, nest, egg, way to rest, family}*
  — verify by grep before restating the count, it grows:
  `grep -l "no standard" *-field-guide.html | grep -v watching-animals` (the exclusion matters —
  a thirteenth sits in the egg, FG 13: *there is no standard way to be interested in an animal*, and it is
  not in this collection, so it is not in the count). **That grep returns 13 files and the answer is
  12, because one hit is a decoy that has to be read rather than counted.**
  `unfinished-animals-field-guide.html` matches while explicitly *declining* the formula — "Eleven of
  these guides arrive at there is no standard star, nest, egg, shark, way to rest. **This one cannot**,
  because what varies here is not the animals — it is us." Its own line is *there is no final draft*.
  Read every hit before adding it; a page that names the pattern is not a page that joins it. (Note
  also that `tortoise-field-guide.html`'s wording is "no standard **member**", not "no standard
  tortoise" — it counts, but do not quote it as the noun in the list above.)
- **Where the form stops is load-bearing.** FG 10 keeps five *turtles people made* in a separate
  section with a dashed border and **no reframe table**, because that table corrects a mistaken
  verdict and running "sounds like / actually" over somebody's cosmology would be obscene. *The
  format difference is the argument.* Standing rule: a subject that cannot take the apparatus gets
  a different card, not a smaller one.

- **The number says *when*. The collection says *what*. Never renumber.** Numbers are chronological
  and load-bearing elsewhere: `changelog.html` has dated public entries naming them, `FACTCHECK.md`
  is keyed by number *and* cross-references by number, and prose references have no redirect.
  Numbers inside a collection therefore run **non-contiguously (1, 2, 6, 7…), and that gap is
  information** — don't "fix" it. **The single exception is No. 37**, which went back and occupied
  the one gap on 2026-08-14 and is therefore the only number here that is not a date: it is younger
  than No. 46, says so on its cover, and marks itself `leap` on spread 8. That was a deliberate
  one-off with its cost stated on the page — **every other gap stays empty**, and backfilling a
  second one would make the numbers stop meaning *when*. A new zine takes the next number in sequence and joins whichever
  collection fits its register.
- **Membership is by register, not by date.** Nos. 17, 19, 20, 21 and 25 are in *Star Stuff* despite
  being made much later, because in each the physics is still doing the argumentative work. Ask
  "is the fact carrying the claim?", not "when was this made?"
- **Collections are pages, not folders** — a note that links, listing members and arguing for why
  they belong together. This keeps faith with `cosmic-connections.html`: the categories are outputs,
  not inputs. They were observed *after* 35 zines had accumulated with no folders at all.
- **Six numbered pieces are deliberately outside the *register* collections**: No. 3 (paradigm
  primer) and No. 18 (self-portrait of the project) sit in [*Foundations*](collection-foundations.html);
  No. 4 (open call for contributors) sits in [*Start Here*](collection-start-here.html); and
  Nos. 37, 47 and 49 sit in [*Easter Eggs*](collection-easter-eggs.html). They keep
  their numbers — this is the sharpest case of *the number says when, the collection says what*
  disagreeing, and each collection page explains it on its face rather than leaving it to look
  like an oversight.
- **Collection names in `.card-series` / `.cover-issue` / `.ss-nav-collection` are invisible to
  search** — `tools/build-search-index.mjs` strips all three as chrome. The collection pages are
  what make the names findable; don't rely on a badge slot for discoverability. The per-piece badge
  added on 2026-08-12 changed nothing here **by design**: it lives inside `.ss-nav`, so it is
  stripped with the rest of the nav, and rebuilding the index after adding it to 66 pages produced
  a **byte-identical** `search-index.json`. That is the check — if adding a badge-like element ever
  moves the index, it is being indexed 66 times and should be in `CHROME_SEL`.
- **`Kin` must not be renamed "Ways of Being"** — it collides with Field Guide No. 5, *A Field Guide
  to the Ways of Being a Star*.
- **There is deliberately no "For Fun" collection.** A bin labelled for fun implicitly labels
  everything else homework, and would become the one place the verify-everything standard could
  quietly relax. The fun is distributed; *Stars We Grew Up On* states this on the page.
- The **prev/next chain follows collection order**: each collection page precedes its members, and
  members run in ascending number within the collection. **123 pages** as of 2026-08-28,
  `collection-start-here.html` → `shorthand-evolution.html`. **17 pages sit outside it, and every
  one is a decision:** `about.html` and `cosmic-connections.html`; **all of Notes &amp; Rationale** —
  `changelog.html`, `design.html`, `print-design.html`, `difference-first-frame.html`,
  `the-ladder-we-dont-print.html` and `collection-notes.html`; and **all of Easter Eggs** — `collection-easter-eggs.html`,
  `out-of-order-zine.html`, `true-facts-zine.html`, `watching-animals-field-guide.html`,
  `hatchery.html`, `quillery.html` and `one-atom-of-justice-zine.html`, because a chain link would
  walk a reader into an egg by accident and stop it being one.
  (`index.html` and `search.html` are utility pages and were never in it, which makes
  123 + 17 = 140.)
  **Don't trust that number — measure it**, and check `prev` and `next` agree in both directions;
  inserting a page means editing its two neighbours, and a one-sided edit leaves a chain that walks
  forward correctly and breaks going back:

  ```bash
  node -e "const fs=require('fs');const nx={},pv={};for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){const s=fs.readFileSync(f,'utf8');let m=s.match(/ss-nav-next\"[^>]*href=\"([^\"]+)\"/);if(m)nx[f]=m[1];m=s.match(/ss-nav-prev\"[^>]*href=\"([^\"]+)\"/);if(m)pv[f]=m[1];}let c='collection-start-here.html',ch=[],seen=new Set();while(c&&!seen.has(c)){seen.add(c);ch.push(c);c=nx[c];}console.log('chain',ch.length,'· mismatches',ch.filter((c,i)=>i>0&&pv[c]!==ch[i-1]).join(',')||'none','· missing',ch.filter(c=>!fs.existsSync(c)).join(',')||'none');"
  ```

### Every count above goes stale, and nothing can see it

**This is the one section of this file with a measured failure rate.** On 2026-08-17 a sweep found
**~24 wrong counts across seven collection pages** and a dozen more in here — Star Stuff said 15 with
22 cards, Field Guides said "thirteen guides, 146 entries" against 14 and 159, the chain said 94 when
it ran 100. One had been wrong since the day it shipped: *How We Got Here* opened a paragraph "No. 45
is the most lopsided chain here" when No. 45 is *The Cloud Phase*, in Star Stuff, not a chain at all.

**Swept again 2026-08-28, and the rot had moved into this file rather than onto the pages.** Every
count above was re-derived. **The thirteen collection pages were almost clean** — twelve of thirteen
hero-counts were right, and every `meta`/`og`/JSON-LD figure was right; only *Star Stuff* was stale
(29 for 30, plus its derived "twenty-two of these pieces were made much later", which is total minus
the seven founders and is now twenty-three). **This file was the stale one**, by a lot: five of the
nine membership rows had missing zines (Star Stuff 26→30, More Than Human 5→8, Kin 6→7, How We Got
Here 9→10, Notes 4→5), the badge total said 120 of 135 pages against 125 of 140, the chain said 118
+ 16 = 126 against 123 + 17 = 140, the signature-phrase counts said 54/52/16/112 against 73/70/19/131,
the cover numeral said 56 against 71, and `.card-moment` said 52 against 62. **The lesson is the
inverse of the 2026-08-17 one:** the reader-facing pages get corrected because readers see them, and
the working notes rot *because* nobody reads them for pleasure. Three cross-page references had rotted
too, which is the worst kind because the page holding the number is not the page that is wrong —
*Foundations* said "the eleven guides in that collection", *Field Guides* cited "Sound prints 121 cards
and 111 songs", and *Start Here* greeted the reader with "a wall of fifty-six zines and fourteen field
guides". **Grep for a count wherever it is quoted, not only where it is owned.**

**And two of the derivations in this section were themselves wrong**, which is worse than a stale
number because it reproduces itself. The prescribed `grep -l "no standard"` returns **13** and the
answer is **12**: `unfinished-animals-field-guide.html` matches while explicitly declining the formula
(*"This one cannot"*). And the `aria-hidden` check on cover numerals reports 70 of 71 because No. 68
puts the attribute on the parent `.cover-corner`, which is correct and inherits. **A derivation that
returns a number nobody reads back is not a derivation — read the hits.**

**Why they rot:** the eight gates measure colour, tag structure, position, paper, sitemap, index
coverage, dead classes and card order. **Not one of them can read a number written out in prose** —
`check-card-order.mjs` comes closest and still cannot, because it compares the numbers *cards*
carry to each other and never to a total claimed in a sentence. So treat every figure in this
file and on every collection page as a **lead, not a fact** — the same standing rule this repo
applies to aggregators — and re-derive it. These are the derivations behind the numbers above:

```bash
ls collection-*.html | wc -l                                   # collection pages (13)
node tools/check-markup.mjs | tail -4                          # pages, tags, badged members, collections
grep -c '<a class="card"' collection-NAME.html                  # one collection's members
git show <commit>:collection-field-guides.html | grep -c 'class="card"'   # what a count WAS, for historical claims
```

Two that need more than a grep, both learned the hard way:

- **Field-guide entries are built from JS object literals**, so the source cannot be counted and the
  schema differs per guide. Count the **anchored records in `search-index.json`** (one per entry,
  which is what the rendered DOM produced) and subtract the cards a guide deliberately does not file
  as entries — currently thirteen. That gives 231 cards / 218 entries.
  **The anchors are slugs, not `#entry-`.** A guide's entry records are anchored `#hydra`,
  `#cassiopea`, `#sperm-whale` and so on, so counting on an `#entry-` prefix returns **zero** and
  looks exactly like a guide with no entries. Count *all* records whose page is a `*-field-guide.html`,
  which equals that guide's card total, and subtract the withheld cards.
- **Chain joints over-count with a naive grep**, because `build-the-eclipse-zine.html` uses the tags
  inline in prose. The discriminator is the tag **opening its own paragraph**:
  `<p(?: class="joint-line")?><span class="joint joint-(documented|contested|leap)"`. That method
  reproduces both the collection page's totals and each zine's own card figures — validate any new
  counting method the same way before trusting it.

**And a count is never in one place.** Field Guides was printing its figures in the `.hero-count`,
the body prose, the `meta` description, the `og:` and `twitter:` cards, the JSON-LD *and* the
colophon line — so a link unfurl and a search result were both quoting a total the page had outgrown.
Residuals drift twice over: "four of the thirteen are companion catalogues… the other seven stand
alone" had both halves wrong, and 4 + 7 hadn't equalled the total for two additions. Grep the number
you are changing, not the sentence.

**And a derived count can be wrong even when the arithmetic is right.** That companion figure is now
**twelve and six** (re-derived 2026-08-27) — and each time it has moved it was the *category* that was
wrong, never the sum.
It was first derived from the four cards carrying `companion to No. N` in `.card-series`, while
`nests-field-guide.html` and `being-alone-field-guide.html` name their companion zine in their own
colophons and had no marker. **A count read off markers is only as honest as the markers**, and no
gate checks that a page which *says* it is a companion is marked as one. Settled 2026-08-17 by Ryan;
reasoning and the rejected seventh-check option are in `DECISIONS.md`.

**The same fault had a survivor, found the same day while adding FG 16.** Re-deriving the figure by
grepping colophons rather than trusting the markers turned up `monotropic-galaxy-field-guide.html`,
whose colophon names two companion zines — *The Cloud Phase* (No. 45) and *Companion Stars* (No. 46)
— against a `.card-series` reading only `Guest guide · 20 entries`. So the six-and-eight settled
on the 17th was itself a marker-derived undercount: the honest figures were **seven and seven**
before FG 16 and are **eight and seven** after it. Its marker has been added. **The lesson is
narrower and worse than "markers rot":** the *fix* for a marker-derived count was applied to the two
pages that prompted it and not swept across the rest, so the corrected count inherited the original
defect. When a category turns out to be too narrow, re-derive the whole set — patching the instances
that were noticed reproduces the bug with a fresher date on it. Derive with
`grep -loiE 'companion to' *-field-guide.html`, then check each hit has a marker; note that
`tortoise-field-guide.html` is companion to a *guide* rather than a zine and is counted separately
on the collection page's own face.

**Some numbers here are historical and must be left alone.** "After 35 zines had accumulated with no
folders at all", "Field Guides waited until there were eleven of them", "44 of 46 pages printed
blank", "90 elements across 45 pages", the "66 pages" of the badge pass, "40 numerals that existed
then" — these record a past state and are the evidence for a rule. Read the sentence's tense, and
check the creating commit, before you touch a number in it.

### Co-branding (Stimpunks Foundation × More Realms)

The site is a collaboration, and every page says so. **Stimpunks always comes first, and the two
carry equal weight** — never shrink one to a courtesy mention. Three forms, and no fourth:

| Form | Where it goes |
|------|---------------|
| `Stimpunks Foundation × More Realms` | colophon footers, `.hero-eyebrow` / `.masthead-eyebrow`, `og:site_name`, JSON-LD `publisher` |
| `Stimpunks × More Realms` | tight monospace slots — `.nav-brand`, `.cover-issue`, index `.card-series` |
| `stimpunks.org · morerealms.com · starstuff.earth` | the URL trio in colophon footers |

- **`×` is the collaboration mark and only that.** `·` stays the house separator, so don't write
  the pairing with a `·` — it disappears into the surrounding list.
- Link both names with the shared **`.ss-cobrand`** class (`starstuff.css`), which makes them
  inherit the surrounding color and take a faint underline, so the pair reads as one mark instead
  of two highlighted links. Its selector is deliberately over-specific (`a.ss-cobrand.ss-cobrand:link`,
  0-3-1) because this sheet loads *before* each page's inline `<style>` — a page rule at 0-2-1
  silently won and stripped the underline on `ls-playlist.html`. Don't "simplify" it back.
- **Covers and print-first sheets carry the pairing as plain text** (`.cover-issue`,
  `ls-broadside.html`, `manifesto.html`'s closing stamp) — no links, because tracked-out uppercase
  underlines read badly and these are artifacts meant for paper.
- **The running per-spread foot (`.spread-footer-left`) stays `Title · Stimpunks`.** It is a short
  running mark, not an attribution block, and at 0.28em tracking the full pairing measures 455px
  in a ~280px slot. Left deliberately; don't "fix" it without re-measuring.
- **Per-piece credit stays exact underneath the co-branding.** Where a zine is Helen Edgar's, it
  is hers and says so (Nos. 11, 28, 30 in her own voice; No. 29 developed after her essay). The
  masthead is shared; authorship is not.
- **`<title>`**: site-level pages end `— Stimpunks × More Realms` (short form, to stay scannable in
  a tab and a search result). A zine's `— Stimpunks Zine No. N` is a *series designation*, not an
  org attribution, and stays as it is.

## Search (`search.html` + `search-index.json`)

Client-side search over the whole collection. No dependencies, no server, no
tracking — the query never leaves the reader's browser.

- **`search-index.json` is a committed build artifact, and it goes stale.** Regenerate it
  whenever page *text* changes and commit it alongside:

  ```bash
  node tools/build-search-index.mjs          # rewrites search-index.json
  node tools/build-search-index.mjs --check  # non-zero exit if stale; writes nothing
  node tools/build-search-index.mjs --force  # write even if a page lost records
  ```

  This is now a step in the `ship-zine` routine, next to the changelog entry. A stale index
  means new pieces are unfindable and old results point at spreads that moved.
- **The generator needs headless Chrome, and that is not incidental.** You cannot index this
  site from its HTML source: the field guides build their entries from JS object literals, and
  much of the zine text sits in spreads that are `display:none` until paged to. The script
  loads each page, lets it render, and reads `textContent` — `innerText` skips anything not
  currently laid out, which on `constellation-field-guide.html` alone drops ~89% of the words.
  It strips `<script>`/`<style>` and the repeating nav chrome, and pads block boundaries so
  `…a taker.` + `There's…` doesn't index as `taker.There's`.
- **The build waits on a condition, never on a clock — don't put a sleep back.** It used to wait
  a flat 1300ms after `Page.enable` and then read the DOM, which makes every run a race. It lost
  that race on 2026-08-11: one build emitted **629 records / 936,594 chars** where the builds
  either side gave **637 / 951,741** — eight records and 15KB gone, **exit code 0, no warning** —
  and `--check` byte-compares, so it reported STALE seconds after the generator had written the
  file. Now it waits for `readyState: complete` plus the page's own text length holding steady
  across two samples, then **extracts twice and requires the two reads to agree**; that agreement
  is the only thing that actually proves nothing was read mid-render. A page that won't stabilise
  is a hard error, not a quiet truncation. Deliberately **not** gated on `document.fonts`: we read
  `textContent`, so webfonts can't change a character we capture, and gating on them hung the run
  for nine minutes when a Google Fonts request never resolved. The gate also made it *faster*
  (~56s, against 66 × 1.3s of dead sleep).
- **A page that loses all its records aborts the write.** The damage case was never a wrong index,
  it was a *silently truncated* one, and a repo-wide 1.25% dip is far too small for a global
  threshold to see — so the check is **per page**, against the committed index. Any page whose
  record count drops is printed; a page dropping to **zero** exits non-zero and refuses to
  overwrite. Deleting content legitimately trips this, which is what `--force` is for.
- **Netlify does not run it.** Still no build step; the script is a local dev tool.
- **A markup change is an index change, and the run will not call it an error.** The 2026-08-18 card split moved
  each card's prose into a sibling `<details>`, outside the `.card` the generic chunker was matching —
  **`index.html` went 111 records to 14** while the per-page line printed as normally as any other. Only the
  *fewer records than committed* check made a noise. The chunk selector now lists **`.card-wrap` ahead of `.card`**,
  and the ancestor-wins rule gives one record per card covering tagline, summary and full description together.
  **After any structural edit, read the per-page record count, not just the exit code.**
- **Granularity is the point.** One record per zine spread (`#spread-N`) and per field-guide
  entry (`#entry-slug`), so a result lands on the passage rather than the top of a long page.
  Pages that are a flat run of headings are chunked per heading, falling back to a
  `#:~:text=` fragment where a heading has no `id`.
- **Coverage is checked, not assumed.** The generic chunker matches a page's repeating unit
  (`section`, `.card`, `.entry`, `.scale`, `.lp-card`), and a page whose repeating unit holds
  almost none of its prose used to sail through: `about.html` has exactly three `.scale` blocks, so
  a `records.length < 3` gate saw "3 records, fine" and shipped **12% of the page**. Fixed
  2026-08-08 by measuring instead of counting — each page's records are compared against
  `textOf(main)`, and below **`COVERAGE_FLOOR` (0.9)** the extractor re-segments by heading. The run
  now prints a coverage
  percentage per page and a warning list at the end, because *a page that indexes 12% of itself
  looks exactly like a healthy one if all you print is the record count.* **If a new page reports
  under 100%, give it real headings or add its container to the chunk selector — don't ignore it.**
- **The remainder record is NOT gated on coverage, and the floor must never be put back in front of
  it (fixed 2026-08-17).** Step 3c indexes whatever no chunk claimed. It used to run only below
  `COVERAGE_FLOOR`, which reads like a sensible rescue rule and is **the `about.html` mistake above
  wearing a higher number**: a percentage is a ratio, and what 3c protects is an *absolute quantity
  of prose*. The bigger a page's repeating unit grows, the more text the same percentage hides — so
  the gate leaked worst on the pages that scored **best**, and as a cliff rather than a slope:
  `collection-star-stuff.html` 93% / 2,532 chars, `index.html` 97% / 4,484, `changelog.html` 100% /
  1,422. **8,438 characters unfindable on the three highest-scoring pages on the site**, including
  every `.collection-intro` blurb on the front page and the whole curatorial argument on a
  collection page — which is the one thing a collection page is *for*. The tell is that the other
  twelve collection pages were fine: they sit at 20–84%, so they drop through 3b and always had
  their intros indexed. **Star Stuff crossed 90% only by growing to the largest card grid here, so
  the page was penalised for succeeding**, and Kin (84%) and Star Gazing (79%) were next in line.
  Un-gating costs nothing it was protecting — 3c can only append text no record claimed, so it can
  never double-index — and `push()`'s 40-char minimum is the right filter because it measures the
  prose, not the ratio. The leftover is segmented by heading where it has headings (so the front
  page's section intros land on `#collections`, `#field-guides`, …), falling back to one lump, which
  is what `inclusion-safety-creed.html` still correctly gets. **The floor keeps its job in 3b**,
  where it chooses between two ways of covering a page; it has no business gating a path that only
  ever adds.
- **All thirteen collection pages carry `id`s on their `h2.section` headings** (46 added
  2026-08-17; `collection-easter-eggs.html` already had them, and its id +
  `scroll-margin-top: 5rem` pairing is the pattern). Without them a search result can only
  deep-link by `#:~:text=` guess. **A new collection page owes its headings ids** — nothing gates
  this, and twelve pages went without them.
- **Duplicate presentations get stripped, not indexed twice.** `ls-playlist.html` lists every song
  as a `.lp-card` (with the note explaining it) *and* again as a flat `.lp-row` link list; the rows
  are in `CHROME_SEL`. The co-brand eyebrows (`.nav-brand`, `.hero-eyebrow`, `.masthead-eyebrow`,
  `.cover-issue`) are stripped for the same reason — the pairing is on all 125 collection members, so as an
  indexed string it carried no information. Colophons keep it, and that's correct: they hold the
  sources and credits, and `search.html` scores heading and repeat matches above one incidental hit.
- `starstuff.js` opens a deep-linked field-guide entry (they render collapsed), so a result
  doesn't land on a closed card with the matched text still hidden.
- **Don't add `cache: 'force-cache'` to the index fetch.** It pins the first copy a visitor
  ever loaded, so they keep querying a stale index forever. Plain `fetch` lets Netlify's ETag
  revalidate.
- Every page reaches search through the `.ss-nav-search` pill in the nav cluster; `index.html`
  has no `.ss-nav`, so it carries its own `.masthead-search` link.

## Contrast & print checking (`tools/check-contrast.mjs`)

The second browser harness in `tools/`, and the thing that makes *Print is not optional* and
*Verify, don't assume* (below) enforceable instead of re-derived. It was written three times as a
throwaway scratchpad script before it was committed; a check that has to be rebuilt from scratch
is a check nobody runs.

```bash
node tools/check-contrast.mjs                      # every *.html in the repo root
node tools/check-contrast.mjs bone-song-zine.html  # just these
node tools/check-contrast.mjs --check              # exit non-zero on any failure
```

- **`--check` is the gating mode**, matching `build-search-index.mjs`'s convention — that's the
  form for the `ship-zine` routine. A plain run always exits 0 so an informational pass doesn't
  read as a crash.
- **It prints a line per page, pass or fail**, with the count of elements actually measured. Same
  lesson as the search-index coverage percentage: when the only output is *it worked*, a page that
  measured 8% of itself is indistinguishable from a clean one.
- **The baseline is 0 as of 2026-08-13, and `--check` is a real ship gate.** It was 110 that
  morning; the last of them were cleared the same day — see *What the sweep to zero settled* below
  for the four rulings, because each one is a precedent, not a one-off edit. Keep it at zero. A
  green gate that has to be read past to find the real number stops being read.
- **A page it could not measure reads `UNREAD`, never `ok`, and gates separately.** The tool's own
  worst failure mode is the one it was built to catch: zero failures out of zero elements is a page
  nobody looked at, and among 89 lines it looked exactly like a passing one. A page silently
  dropping out removes its failures from the total, so the number goes *down* and reads as an
  improvement — which is why unmeasured pages are counted apart from the failure total and reported
  in their own block; under `--check` they exit non-zero on their own, before contrast is considered.
  This mattered more when the baseline was non-zero, but it is not baseline-dependent: at a baseline
  of 0 a page that measures nothing still passes silently.
- **The wait is a condition, not a clock.** It was `sleep(1300)` with the comment *"let the
  client-rendered field guides paint"* — a guess. It now waits for `readyState: complete` plus a text
  length steady across two samples, exactly as `build-search-index.mjs` does, and a page that never
  settles is reported `UNREAD` rather than measured half-rendered. **Measured before changing it:**
  three runs over the three heaviest field guides gave identical counts, so the sleep was not
  currently losing the race. It is insurance, not a bug fix — but the search-index builder lost this
  same race *on local files* (629 records against 637, exit 0, no warning), so "local is fast enough"
  is already disproven in this repo for a heavier operation. Neither tool aborts the sweep on a bad
  page; abandoning 49 remaining pages to report one is a worse trade.
- **Text is composited against its real ancestor background stack**, not against the token you
  assume applies — a card at `rgba(15,15,42,0.6)` inside a panel inside the void is none of those
  three colors. Element `opacity` folds into the text alpha, because opacity is what the reader
  sees. Thresholds are WCAG AA: 4.5:1, or 3.0:1 at ≥24px (≥18.66px when bold).
- **SVG `text`/`tspan` fills get their own pass**, because `color` never reaches `fill` and the CSS
  pass is structurally blind to diagrams — 226 failing labels across 27 pages hid there until
  commit `bf317cd`. Two things that pass encodes, both near-misses in that commit:
  - **Composite the shapes actually painted behind the glyphs.** Labels are often dark ink on a
    bright accent disc, which is correct (`elements-field-guide.html` had it right first). A probe
    that only knew the page ground called all 8 of that page's element symbols 1.05:1, and
    "fixing" them would have erased every symbol.
  - **Only shapes earlier in document order count** (SVG paints in order), and only
    `rect`/`circle`/`ellipse` — a `<path>` bounding box claims area the path never paints, so
    trusting it would invent backgrounds and mask real failures.
- **The print pass models paper, not print emulation.** `Emulation.setEmulatedMedia` applies the
  print stylesheet but still paints backgrounds; a real reader's sheet has none, which is the whole
  reason 44 pages printed blank. So the gating print number composites against the bare white sheet,
  honoring a background only where the page asked with `print-color-adjust: exact`. SVG fills are
  content and do print, so diagram shapes still count. The other way round — backgrounds painted,
  as if the reader ticked the box — is reported as a separate `+bg` warning tier, which is where a
  page hardcoding a dark background instead of aliasing `--sp-card` shows up.
- **Screen measurement reveals every spread and entry first** (`.spread.active`, `.entry.open`),
  then *undoes it* before the print pass. Without the reveal, a 12-spread zine reports on spread 1
  and looks spotless. Without the undo, the tool measures a state no reader ever gets: the print
  stylesheet reveals `.spread` and `.field-grid .entry-notes` itself, and nothing adds `.open`
  when printing — leaving the class on invented 257 print failures on `elements-field-guide.html`
  alone.
- **What it cannot measure, it says.** Gradient-clipped headings (`background-clip: text`) and
  labels over a gradient have no single pair of colors to compare, and are listed for checking by
  eye rather than skipped silently. Two exemptions exist, on their own lines and **counted**, never
  summed together — disabled prev/next buttons (inactive UI components) and the cover watermark
  numeral (below), both under WCAG 1.4.3. Two allowances added up read as one small concession;
  kept apart, a number that grows is a number somebody can question.
- **It is a local dev tool. Netlify does not run it**, same as the search index. Requires Chrome
  and Node 22+.

### What the sweep to zero settled (2026-08-13)

Four rulings, each a precedent for the next page rather than a one-off edit. The common thread:
**`opacity` was doing the work that colour should have been doing.** Every one of these was a
designer reaching for a fade to say *this is subordinate*, and a fade is the one way to say it
that also makes the text unreadable.

- **Opacity is not a hierarchy tool, and the house rule already said so.** *Full-opacity body text*
  is in the design system; the failures were the places it had quietly lapsed. `manifesto.html`'s
  `.sp-divider` faded a whole flex row to 0.3, dragging the ★ down with the two hairlines it was
  meant to dim — the fade now sits on the `::before`/`::after` rules, which are non-text decoration.
  `shorthand-evolution.html` had two annotation rows at inline `opacity:0.3`. `bone-song-zine.html`
  faded its drop cap to 0.8 — a drop cap is the paragraph's first letter, so it is body text.
  **Rules, hairlines and shapes can whisper. Glyphs cannot.** If something must recede, give it a
  quieter *colour* (`--sp-muted` against `--sp-white`), not a lower alpha.
- **A caption inside a decorative motif is still text.** The `.cover-motif` SVGs run at
  `opacity: 0.7–0.75`, and a violet or pink *400* label cannot reach 4.5:1 through that veil —
  even at `fill` alpha 1.0 violet tops out at 4.46:1. The fix is to step the *label* one rung up
  the same Tailwind ramp (400 → 300: `#a78bfa`→`#c4b5fd`, `#f472b6`→`#f9a8d4`), which lands ~5.7:1
  and stays inside the documented palette lineage. **Do not raise the motif's own opacity** — that
  is the artwork, and it is tuned.
- **Print ink is `#111111` for SVG labels, `#222222` for body text, and the difference is load-bearing.**
  A diagram label often sits on a *coloured shape that survives print because it is content*, not a
  background — the element discs on `elements-field-guide.html`. `#222` on the C, Fe and I discs
  measured 4.16–4.24:1, under AA by a hair, while the same ink on bare paper is 15.9:1. Darkening
  the label in `starstuff.css` reaches every such shape at once; darkening each disc chases them
  one at a time and misses the next one.
- **The one decorative exemption: `.cover-corner-num`.** The ghosted numeral on 71 zine covers
  restates a number printed at full contrast two lines below it in `.cover-issue` ("Zine No. 30").
  It is a watermark, not a label. Reaching 3:1 would need opacity 0.44–0.57 against the 0.15–0.26
  it carries — **a different cover, not a fixed one.** So it is exempt under WCAG 1.4.3 *pure
  decoration*, with two constraints that make the claim honest and are the bar for any future
  exemption:
  - **The selector list in the tool is explicit and short.** There is deliberately no
    "anything `aria-hidden`" rule, because that would let a future failure disappear by adding an
    attribute — the exemption must be a decision somebody wrote down, not a mechanism to fall into.
  - **An element must *also* be `aria-hidden` to qualify.** Text a screen reader still announces is
    not decoration, so the claim has to be true in the markup before the tool will honour it. All
    40 numerals that existed then were marked in the same pass, which also stopped screen readers
    announcing a bare "30" before the title. **Every cover added since has carried it** — the count
    is 71 now, and the day one ships without `aria-hidden` the exemption stops applying to it and
    `check-contrast.mjs` will fail the page rather than wave it through. **Check the parent, not just
    the numeral:** `proportioned-to-the-groove-zine.html` (No. 68) puts `aria-hidden` on the wrapping
    `.cover-corner` instead, which covers the numeral by inheritance and is correct — so
    `grep -c 'cover-corner-num" aria-hidden'` reports 70 of 71 and the missing one is a false alarm.

## Markup checking (`tools/check-markup.mjs`)

The fourth gate. It and `check-sitemap.mjs` are the two that never open a browser.

```bash
node tools/check-markup.mjs                       # every *.html in the repo root
node tools/check-markup.mjs collection-print.html # just these
node tools/check-markup.mjs --check               # exit non-zero on any failure
```

- **It exists because of a fault every other check passed.** `collection-print.html` shipped with
  four `<a>` elements nested inside the `<a class="card">` wrapper. Anchors cannot nest, so the
  parser closed the outer anchor early and each card came apart on the live page — bordered box
  ending three lines in, description orphaned, the footer tag and arrow floating in empty space.
  Contrast passed it (the text *was* legible), the search index passed it (all the words *were*
  there), `check-sheets` doesn't apply to a screen page. A human noticed a button sitting alone.
- **It reads source, not the DOM, and that is the whole design.** You cannot find this in a DOM:
  by the time a DOM exists the parser has already repaired it, and
  `document.querySelectorAll('a a')` on the broken page returns **zero**. The evidence survives
  only in the source text. That also makes it the fastest gate here — no Chrome, no dependencies,
  140 pages and 132,800 tags in about 0.25s.
- **Five faults, each one silent:** nested interactive elements (`<a>`/`<button>` inside each
  other — the parser closes the outer, so everything after falls out of its wrapper); a block
  element inside a `<p>` (auto-closes the paragraph part-way through); and **duplicate `id`**,
  which matters here more than most sites because this one runs on fragments — `#spread-N`,
  `#entry-slug`, `starstuff.js`'s deep-link opener, every `search-index.json` record, and the
  `aria-labelledby` wiring in `changelog.html`. A duplicate doesn't error; it just sends a reader
  to the wrong passage. And, added 2026-08-12, **`.ss-nav` outside the content shell** — the one
  house-convention check in the file. Put the nav outside `.zine-shell`/`.doc-shell` and the header
  runs full-bleed while the page beneath it stays in its 820px column. **It shipped live on Nos. 38
  and 39, was reintroduced on No. 40 and repeated on No. 41 — four times, twice after being
  "fixed"** — which is what a convention with no gate behind it is worth. Pages with no shell
  (broadsides, playlists) are exempt by design.
- **The fifth is the collection badge, added 2026-08-13**, and it is the second house-convention
  check — added after three Print broadsides and the Bowie rack were found without one, again by a
  person rather than a gate. It checks both directions: a member page carries the badge, an exempt
  page (`index.html`, `search.html`, the collection pages) does not, the badge sits **inside**
  `.ss-nav`, and its `href` *and* its label agree with the collection page that actually cards it.
  A page **no collection cards** is reported too — membership is derived from those cards, so an
  uncarded page can't be checked at all, and staying silent would excuse exactly the same-pass rule
  above. **No other gate can see any of this, and one provably cannot:** the badge is stripped as
  chrome by `build-search-index.mjs`, which is why adding it to 66 pages left `search-index.json`
  byte-identical — the property that makes the index blind to its absence. The map is built from
  the collection pages' own `<a class="card">` hrefs and the names from their `<title>`s, never
  from a list kept in the tool, so there is no second answer free to drift from the first.
- **It is not a validator and shouldn't grow into one.** It ignores unclosed tags, attribute
  syntax, and everything else browsers recover from harmlessly. The bar for adding a sixth check
  is that the browser silently hands the reader a different document than the source describes —
  or, as with the nav and badge checks, that a structural fault is invisible to *every* other gate
  and has recurred often enough to prove that remembering is not a control.
- **The baseline is 0.** A clean tree passes, so `--check` is a real ship
  gate rather than an informational sweep. (This was the distinction from `check-contrast.mjs`
  until 2026-08-13, when that one reached zero too — all eight gates now hold at 0.) It was
  regression-tested against the actual broken file
  from git history, and against decoys that must *not* fire — an `a a` CSS selector, a nested
  anchor inside a JS string, and a `>` inside an attribute value.

## Sheet fitting (`tools/check-sheets.mjs`)

Does a paper-first sheet actually land on the paper? Run it on any broadside before shipping:
`node tools/check-sheets.mjs --check`. It prints each sheet to PDF at **both** US Letter and A4 and
counts pages, *and* separately measures content height against the box — because a fixed-height
sheet whose content overruns does not paginate, it is silently **clipped**, so a clean page count
can still hide a cut-off final line. It measures at the real page-box width (~726px), not a desktop
viewport, because print media queries resolve against the page box. Both original broadsides called
themselves "a two-sided single sheet" while `ls-broadside.html` printed as **3 sides on Letter and
2 on A4**; nothing in the repo could see it. Local dev tool, Chrome and Node 22+, and it uses its
own debugging port on purpose — sharing one with the index generator let a build attach to a
browser another tool was shutting down.

## Sitemap checking (`tools/check-sitemap.mjs`)

The fifth gate, promoted from a throwaway snippet on 2026-08-12 because it kept finding things.

```bash
node tools/check-sitemap.mjs               # audit sitemap.xml
node tools/check-sitemap.mjs --check       # exit non-zero on any problem
node tools/check-sitemap.mjs path/to.xml   # audit a different file
```

- **It exists because `sitemap.xml` is hand-maintained and nothing looked at it.** The other
  gates each examine a *page*; none opens the sitemap, so a page could be entirely absent and every
  check still passed. Nothing on the live site looks wrong either, which is why the two faults it
  was built from survived so long: `the-nearest-body-zine.html` had **never been listed** — a live
  zine, linked from the index, in the reading chain, uncrawlable since 20 July — and
  `six-ways-broadside.html` was listed **twice**. Both were found by a person happening to audit the
  file while adding a page, not by any check.
- **Seven checks, all forms of one question** — *does the sitemap agree with the filesystem?*
  missing entries, stale entries (file gone), duplicates, off-site or non-https `loc`, malformed
  structure (unbalanced `<url>`, no `<urlset>`, a `<url>` with no `<loc>`), the **bare root entry**
  (`index.html` is deliberately unlisted and relies on it, so its absence would be a hole the
  "missing" check is designed not to see), and `lastmod` sanity — present, `YYYY-MM-DD`, a real
  date, not in the future.
- **It deliberately does not check `lastmod` against git**, and that restraint is the interesting
  part. A repo-wide chrome change — the collection-badge pass touched 66 pages without altering a
  word — would mark every one of those dates "stale" and invite bumping them, telling crawlers to
  re-fetch 66 pages that did not meaningfully change. **A check whose first run emits 66 warnings
  nobody should act on is a check that gets ignored, and then so are its real findings.** Whether an
  edit earns a new `lastmod` is an editorial call and stays with the person making it. It also
  ignores `priority` and `changefreq` (Google says it ignores both) and never touches the network.
- **The bar for an eighth check** is the same as `check-markup.mjs`'s: a discrepancy between what
  the sitemap claims and what the site is, invisible to a person reading the file.
- **Regression-tested against the real fault**, not just synthetics: run against `sitemap.xml` as it
  stood at commit `e13a96b` it reports the missing zine and the duplicated broadside. Seven
  synthetic faults were each confirmed to fire, and the decoys that must *not* fire — the bare root
  entry, the `index.html` exemption, a `lastmod` of exactly today — pass clean.
- No Chrome, no dependencies, like `check-markup.mjs`. Local dev tool; Netlify does not run it.

## Text collision checking (`tools/check-overlap.mjs`)

The sixth gate, added 2026-08-14. The others ask *what colour is it*, *what shape is the tag
tree*, *does it fit the paper*, *is it in the sitemap*. This one asks **where is it**, which nothing
here had ever measured.

```bash
node tools/check-overlap.mjs                     # every *.html in the repo root
node tools/check-overlap.mjs the-lines-we-drew-zine.html   # just these
node tools/check-overlap.mjs --check             # exit non-zero on any collision
node tools/check-overlap.mjs --verbose           # every finding, not the first 8
```

- **It exists because No. 48 shipped with three text collisions and all five gates passed it.** The
  cover motif's caption ran through `.cover-title`; the motif label stack ran through
  `.cover-corner`, and after a first over-correction through `.cover-issue`; and Figure 8's two-line
  *never / seen* label overlapped itself. Each was found by a person looking at a screenshot. **None
  of the five was wrong to pass** — a collision is not a colour, not a tag tree, not a word, not a
  page count, and the pages were legible, well-formed, fully indexed and correctly listed.
  `the-shadow-is-bigger-zine.html` even carries a source comment warning that *anything past y≈240
  in this viewBox lands on the words*, which is the tell: **a comment is a note, not a control.**
- **Inked extent, not the element box — this is the whole design.** The throwaway prototype compared
  `getBoundingClientRect()` of block elements and drowned in false positives, because `.cover-issue`
  is a full-width block whose text stops far short of its right edge. Its "ignore boxes wider than
  92% of the host" filter is a proxy for the real question and not a good one — `.cover-issue`
  measures 87%, so it stayed. Now every HTML **text node** goes through a `Range` and
  `getClientRects()`, which ends exactly where the glyphs end. Text nodes rather than elements also
  kills the other guaranteed false positive for free: a `<span>` inside a `<p>` always overlaps its
  parent's box, but their text nodes are disjoint.
- **Line boxes are not ink, and half-leading is space a neighbour may use.** `.cover-corner-label`
  tucks under `.cover-corner-num` with `margin-top:-0.3rem` on all 56 covers and is perfectly
  correct; trust the line box and all 56 fail. Each rect is shrunk to `INK_RATIO × font-size`
  centred in the line box, and `MIN_OVERLAP` then requires a real intersection **in both axes**,
  scaled to the smaller type — 2px is a catastrophe at 5.5px and nothing at 72px. The model is
  deliberately generous: it can only under-report, and **an under-reported collision still has a
  human to catch it, where an over-reported one is a gate nobody reads.**
- **It also reports `clipped`** — text outside an `overflow:hidden` ancestor, or outside its own
  `<svg>` viewport (a viewBox'd `<svg>` clips by UA default). `CLIP_TOL` is a fraction of the type
  size, not a pixel count, because `getBBox` reports the *advance* box including side bearings —
  empty space no ink occupies. It sits **between two measured cases**, not at a guessed number:
  `the-lines-we-drew-zine.html` lost **0.86em** off "light-years" and the reader got *"ight-years"*,
  while `why-difference-comes-first-zine.html` had **0.22em** of a closing quote's bearing past the
  edge with the glyph intact.
- **The baseline is 0, and getting there found seven pre-existing faults — none of them false
  positives.** Four covers (Nos. 30, 27, 19, 17) had a motif caption rendered on top of the gradient
  title word, *the same fault as No. 48 and undetected in shipped work*; `lydtyss-zine.html` had
  COMMUNITY — the one unbreakable label — overflowing its 3rem grid column onto the body text; plus
  the two clip cases above. **A gate whose first honest run finds seven real defects is the argument
  for the gate.**
- **Regression-tested against reconstructed real states, not only synthetics.** No. 48 landed in a
  single commit, so its broken states are not in git — but the page's own comments record the exact
  coordinates, so faults 1 and 2 rebuild precisely (`y=168`; `y=70/90/106`) and both fire, naming
  the right elements. Fault 3's original spacing is unrecoverable; the label fires at ≤3 units of
  separation and is clean at 4, where the x-height ink genuinely clears. Decoys confirmed silent.
- **What it does not measure, on purpose.** Print (paper is a different layout; `check-sheets.mjs`
  owns page fitting). One viewport, 1280×900, matching `check-contrast.mjs` — a collision that only
  happens at 380px is real and this will not see it. And **text over non-text**: a label crossing a
  line or an arrowhead is a legibility judgement about artwork, and still needs eyes at render size.
- 140 pages in ~2 min. Chrome and Node 22+; local dev tool, Netlify does not run it.


## Dead class checking (`tools/check-classes.mjs`)

The seventh gate, added 2026-08-26. The other six ask *what colour is it*, *what shape is the tag
tree*, *where is it*, *does it fit the paper*, *is it in the sitemap*, *is it findable*. This one
asks **did the styling you asked for actually happen**, which nothing here had ever measured.

```bash
node tools/check-classes.mjs                     # every *.html in the repo root
node tools/check-classes.mjs dolly-zine.html     # just these
node tools/check-classes.mjs --check             # exit non-zero on any finding
node tools/check-classes.mjs --verbose           # every finding, not the first 8
```

- **It exists because of a fault that produced no symptom.** A sixth refusal on No. 67 was written
  as `<span class="pink">` and never rendered: `.pink` is declared as `.body-text .pink`, and
  `.refusals` is a **sibling** of `.body-text`, not a descendant. All six gates passed it, and none
  was wrong to — the markup is well formed, the text is legible, the box is in a sensible place,
  the words are indexed. **`check-contrast.mjs` passed it *because* it failed:** unstyled text
  inherits a colour that already clears AA, so the defect had no measurable consequence anywhere.
  An intention that silently did not happen is not a colour, a tag tree, a position, a word, a page
  count or a URL.
- **Two findings, and only the second needs a browser.** `unknown` — no rule anywhere mentions the
  class (a typo, or a card copied from a page that defines it into one that does not). `inert` —
  rules exist, but not one of them reaches *this* element. `unknown` is answerable from source;
  `inert` needs the ancestor chain and the real cascade, so the page is loaded and every class use
  is tested with `Element.matches()`. That is the browser's own selector engine answering, rather
  than a re-implementation of it.
- **A class used only as a scoping ancestor is NOT inert, and getting that wrong is the whole
  difficulty.** `.masthead-toc-collections a` styles the anchors *inside* the `<ul>`; the `<ul>`
  matches nothing itself and the class is still doing all the work. The first draft flagged exactly
  that, twice, on the front page. So each selector is cut at the compound carrying the class and the
  element is tested against that **prefix** — "is this element the thing the selector names in that
  position", subject or ancestor alike.
- **It is the one gate that cannot read `file://`.** Its five browser-using siblings want computed
  styles, text and geometry, all of which Chrome hands over for a local file. This one wants
  `.cssRules` — the rules themselves — and a `file://` page treats its own linked stylesheet as
  cross-origin and throws `SecurityError`; `--allow-file-access-from-files` does not lift it. So
  `tools/serve.mjs` is spawned on its own port and the pages are read over `http://127.0.0.1`.
  A **same-origin** sheet that still will not open is `UNREAD`; the Google Fonts sheet is expected
  to be unreadable and is counted separately, because treating it as fatal would make every page
  UNREAD and treating a blocked local sheet as fine would report every class on the page as dead.
- **The baseline is 0, and getting there found 25 real defects across 12 pages — no false
  positives.** Eleven vestigial `col-text`/`col-diagram` on a zine that stacks by single-column grid
  rather than the house flex block; a `.card-moment` on **`index.html`**, copied from a collection
  page, rendering as a bare paragraph — and CLAUDE.md said the index carried none, which was true
  when written; `.footer-egg-fill` on two SVG paths with no rule anywhere; a `<th class="sig">` on
  No. 55 whose rules only ever reached `td.sig`, so the σ column header never got its own styling;
  and **eight accent utilities that silently did nothing** — four `.pull-quote` colour variants a
  page used but never defined, and four colour spans sitting outside `.body-text`. Every one was an
  author asking for something and not getting it.
- **HOOKS are explicit, short, and counted.** Some classes are addressed by `starstuff.js` or by the
  tools in this directory rather than by CSS — `.spread`, `.card-wrap`, `.ss-nav-prev`, the injected
  `.prev`/`.next` buttons. They are a hand-written list with a comment naming *what reads each one*,
  deliberately not a pattern like "ignore `js-*`": an exemption should be a decision somebody wrote
  down, not a mechanism to fall into. `check-contrast.mjs` settled that argument first, and the
  count is printed on its own line so a list that grows is a list somebody can question.
- **What it does not do.** It does not check the reverse direction — dead CSS costs bytes, a dead
  class attribute costs the reader the thing the author meant to say, and only one of those is a
  defect in the artifact. It does not judge specificity: a class whose rule matches but is
  overridden is a different fault, and `.ss-cobrand`'s over-specific selector is the standing
  reminder that it exists. It does not reveal spreads or open entries, unlike its two browser
  siblings — matching is structural, not visual, and revealing would inject `.active`/`.open`
  classes the tool would then have to explain away.
- 140 pages in ~2 min. Chrome and Node 22+; local dev tool, Netlify does not run it.

## Card order checking (`tools/check-card-order.mjs`)

The eighth gate, added 2026-08-27, and the third that never opens a browser. The others ask
*what colour is it*, *what shape is the tag tree*, *where is it on screen*, *does it fit the paper*,
*is it in the sitemap*, *is it findable*, *did the styling happen*. This one asks **is it in the
right place in the list**, which nothing here had ever measured.

```bash
node tools/check-card-order.mjs                     # every *.html in the repo root
node tools/check-card-order.mjs index.html          # just these
node tools/check-card-order.mjs --check             # exit non-zero on any finding
node tools/check-card-order.mjs --verbose           # every finding, not the first 8
```

- **It exists because a card in the wrong place misreports where a collection ends.** While No. 69
  was being added, the last `<a class="card">` in document order on `collection-star-stuff.html` was
  No. 62 — so No. 62 looked like the tail. It was not: **No. 63's card was sitting between Nos. 45
  and 46, identically on the index and the collection page**, which reads as one insertion
  replicated rather than a decision. **The prev/next chain follows collection order**, so the
  misplacement made the chain look as though it ended a piece early, and No. 69 was very nearly
  wired into the middle of the collection. All seven existing gates passed and none was wrong to:
  **`check-markup.mjs` derives membership from card *hrefs*, and the map it builds is a set — a set
  has no order.** The rest measure colour, tag structure, position, paper, sitemap and findability.
- **Its first honest run found a second live instance the manual fix had missed.** The *Stars We
  Grew Up On* grid on `index.html` read **12, 66, 67, 13** — No. 13 last — while its own collection
  page had the same four ascending. Two pages disagreeing about one collection, invisible to
  everything. That is the argument for the gate, and it is why fixing the instance you noticed is
  never the same as fixing the fault.
- **Ascending *within a series*, within a grid — and the series split is load-bearing.**
  `collection-easter-eggs.html` interleaves on purpose (Zine 37, Zine 47, The Hatchery, The
  Quillery, Field Guide 13, Zine 49): the Zine numbers ascend among themselves with a Field Guide in
  the middle. Checking one merged sequence would fail that page for doing exactly what it means to
  do. **Non-contiguous numbering is never reported** — gaps are information, so 1, 2, 6, 7 is
  correct and only the *direction* is checked.
- **Unnumbered cards are skipped, and the count is printed.** 66 of the 244 cards carry no series
  number — broadsides, playlists, racks, essays, and the furniture in *Start Here*, *Foundations*
  and *Notes* — and there is no mechanical answer to where `About` belongs relative to
  `Cosmic Connections`. Inventing one would be the tool asserting an editorial preference. The
  number is on its own line so that a denominator which quietly shrinks is visible.
- **Cards outside every grid are reported, not shrugged at.** An uncheckable card is not a passing
  card; this is the `about.html` lesson from the search index in another costume. If that figure is
  ever non-zero the `.artifact-grid` selector has drifted and the gate is checking less than its
  output suggests.
- **Deliberately NOT checked: whether the index and a collection page agree with each other.** That
  sounds like the obvious companion check and it would emit noise nobody should act on — *Notes &amp;
  Rationale*, *Print* and *Sound* are unnumbered, and their index and collection grids legitimately
  run in different orders. The numeric case needs no cross-page check anyway: two grids both
  ascending within series already agree wherever agreement is defined. Also not checked: whether a
  grid's order matches the chain, because the chain is different markup and conflating them would
  make a single failure unable to say which half was wrong.
- **`ALLOWED_UNORDERED` exists and is empty.** Same bar as `check-contrast.mjs`'s watermark
  exemption and `check-classes.mjs`'s HOOKS: an exemption must be a decision somebody wrote down
  with a reason, keyed `page.html#gridindex`, never a pattern to fall into. The count prints on its
  own line.
- **Source, not DOM, and that is checked rather than assumed.** Cards are static HTML and no script
  builds or sorts them; source order was compared against DOM order across all fourteen
  card-bearing pages before this was written, and they agree everywhere. It masks `<script>`,
  `<style>` and comments first — the decoy fixture caught a card anchor inside a JS template string
  being counted as a real card.
- **Regression-tested against the real broken states, not only synthetics.** Run against
  `index.html` and `collection-star-stuff.html` at commits `d10de14` and `aae6008` it names both
  faults, the right grids and the right cards. Five synthetic faults fire, including two descents in
  one grid and an independent Field Guide descent. Decoys confirmed silent: non-contiguous ascending
  numbers, interleaved series, `No. 21` in card *prose*, a `.card` CSS selector, a card anchor in a
  JS string, unnumbered cards in non-alphabetical order, a `· Guest` suffix after the number, a
  one-card grid, and two equal numbers.
- **The baseline is 0**, so `--check` is a real ship gate. 140 pages in about 0.1s. No Chrome, no
  dependencies. Local dev tool; Netlify does not run it.

## Design system

- **Font URLs must be verified, not assumed.** Atkinson Hyperlegible Next publishes weights
  **200–800** on Google Fonts. The correct request is
  `family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800`. Asking for `200..900`
  returns **HTTP 400 with zero `@font-face` rules**, so every visitor silently falls back to
  `system-ui` — and you will not notice locally if the font is installed on your machine, which is
  exactly how it shipped unnoticed. After changing any Google Fonts URL, `curl` it and confirm
  `@font-face` blocks come back; better, load the page and check the woff2 actually downloads.
  (Fraunces legitimately uses `200..900` — the range is per-family.)
- **Typeface:** Atkinson Hyperlegible Next (max legibility). *Bone Song* also uses Fraunces and
  Space Mono for editorial voice; the injected footer nav uses Space Mono.
- **Palette** — the canonical tokens live in `starstuff.css` as `:root { --sp-* }` (single source
  of truth). Pages alias them inline (e.g. `--purple: var(--sp-purple)`); introduce a new shared
  color by adding a `--sp-` token there, not by hardcoding a hex across pages:
  - void/ground `#0a0a14`, deep/card `#0f0f2a`
  - purple `#a78bfa`, pink `#f472b6`, gold `#fbbf24`, cyan `#22d3ee`, green `#4ade80`
  - white `#f9fafb`, secondary `#b8aed0`, muted `#c4b5d4`
- **Palette lineage** — the accents are **Tailwind CSS v3's 400 ramp** (violet/pink/amber/cyan/
  green-400, gray-50), verified against `tailwindlabs/tailwindcss` v3.4.17 `src/public/colors.js`.
  They are exact; don't "correct" or round them. The palette *began* as a Solarized dark variant
  pre-git, and **no Solarized value remains** — cite Solarized for the method (named accent set at
  near-uniform lightness, non-black hue-cast ground, warm cream paper), never for the colors, and
  never imply a traceable derivation. Our contrast is the *opposite* of Solarized's goal: 18.84:1
  body text vs. its 4.75:1. See README → *Palette lineage* and `design.html`.
- **Principles:** full-opacity body text (no faded grays), generous line height, `8px` card
  radius, a recurring `3px` colored left border, and a pure-CSS starfield.
- **Accessibility first.** `starstuff.css` already honors `prefers-reduced-motion` (neutralizes
  twinkle/spin/fade/smooth-scroll) and hides nav in `@media print`. Keep artifacts
  keyboard-navigable and print-friendly — they're meant to be printed and handed to people.
- **Print is not optional, and it is not free.** Browsers leave *Background graphics* off by
  default, so a light-on-dark page that carries its screen colors to paper **prints blank**. This
  silently broke 44 of 46 pages until 2026-08-08. `starstuff.css` now inverts the `--sp-*` tokens
  inside `@media print`, so **a new page gets this for free only if it aliases the tokens**
  (`--star-white: var(--sp-white-soft)`) rather than hardcoding hexes. If a page hardcodes colors,
  it needs its own small `@media print` override — see the ones in `bone-song-zine.html` and
  `ls-broadside.html`. SVG diagrams paint with `fill`/`stroke`, which `color` never reaches, and are
  handled separately in the shared sheet. **Verify, don't assume:** run
  `node tools/check-contrast.mjs --check`, which measures both media for you — see *Contrast &
  print checking* above. A stated principle nobody measures is a wish. Full account: `design.html`.
- **Gradient-clipped headings are the second way to print blank, and the token inversion does not
  fix them.** A heading painted with `background-clip: text` plus
  `-webkit-text-fill-color: transparent` takes its color from the *fill* property, which beats
  `color` outright — so forcing every color to ink left the glyphs transparent, and since
  backgrounds don't paint on paper nothing filled them back in. **90 elements across 45 pages**
  printed blank this way until 2026-08-12, including the `★ stuff` wordmark (the front page printed
  untitled), every `.spectrum-word` and `.flock-word`, and the whole manifesto title. The shared
  print block now sets `-webkit-text-fill-color` alongside `color` in both blunt rules, so a new
  page gets it free; **don't add page-specific selectors for this** — the block's own comment argues
  for chasing the mechanism instead, and this is why.
- **A closed `<details>` is the third way to print blank, and it needs a rule *and* a script.** Collapsed content
  does not print, so the front page would have gone to paper with 97 cards and no descriptions; the token inversion
  cannot reach it, because this is not a colour. How a closed disclosure hides its content has moved across engine
  versions — `display`, then `content-visibility` on `::details-content` — so **a CSS-only answer is a bet on which
  engine the reader has**. `index.html` carries both an `@media print` rule and a `beforeprint`/`afterprint` handler
  that opens every disclosure and restores each one exactly as the reader left it. Verify under print emulation
  rather than by reading the stylesheet: the check is that every `.card-details-body` lays out, in `#222222`, with
  the summaries hidden.
- **`check-contrast.mjs` cannot see that fault, and says so.** Gradient-clipped text has no single
  pair of colors to compare, so it is listed as **"unmeasured — check by eye"** rather than guessed
  at. That list ran 196 entries and was being read as a footnote. *A tool reporting "I can't check
  this" is reporting a gap, not clearing it* — when the unmeasured list grows, look. The narrow
  question it can't ask is "which elements compute a transparent fill under print media?", which is
  a short CDP probe against `Emulation.setEmulatedMedia {media:'print'}`.

## Voice & editorial conventions

- **Refer to neurodivergent and disabled people in the first-person plural — we / us / our — not
  third person (they/them/their).** We write from within the community, not about it. Second person
  (you / your) is fine when directly addressing the reader.
- **Always capitalize the "A" in Autistic.** Write *Autistic* (and *Autistics*) as an identity
  term throughout all prose — headings, body, colophons, card descriptions, and meta/OG/Twitter
  descriptions. Exceptions, left unchanged: URLs, slugs and in-page anchors (`id="…"`,
  `href="#…"`), and verbatim work/quote titles. This rule is about *Autistic* specifically — leave
  *autism* lowercase.
- Tone braids **wonder and punk**: Sagan-esque awe alongside community rage at systems built too
  narrow. Gentle and fierce at once.
- Ground claims in real science and cite real sources. Existing pieces lean on stellar
  nucleosynthesis, piezoelectric bone (Yasuda 1950s; Bassett et al.), endosymbiosis
  (Margulis 1967; Sender, Fuchs & Milo 2016), the neurodiversity paradigm (Nick Walker; the InLv
  community — Martijn Dekker, Jim Sinclair, Autism Network International), the spiky profile
  (Damian Milton), and ethodiversity (Ombre Tarragnat).
- Many zines carry a **"Not:" refusals set** — explicitly naming the traps the piece refuses
  (e.g. the superpower/inspiration and extraction framings). Preserve this convention.

### The "Cavendish" naming trap (do not conflate)

Two senses appear and must stay distinct:

- **Cavendish banana** — the genetic-clone *monoculture*, used as a cautionary tale: uniformity is
  efficient but brittle, one blight from collapse. (*The Universe Runs on Difference*, Zine No. 8.)
- **Cavendish Space** — Stimpunks' concept for environments *built for diversity* (caves,
  campfires, watering holes for dandelions, tulips, orchids). It is the **answer** to monoculture.

Keep the banana as the problem and Cavendish Space as the response. "We refuse to build Cavendish
Space" is inverted and wrong.

### The "wood wide web" trap (hedge, don't assert)

Mycorrhizal symbiosis — fungus and plant root trading minerals for sugar — is settled science and
ours to use freely. The *forest-wide* story is not: Karst, Jones & Hoeksema (*Nature Ecology &
Evolution* 7, 2023) find the prevalence of common mycorrhizal networks and their benefit to
seedlings insufficiently supported, and find no published evidence that elder trees preferentially
feed their own offspring through them. It rhymes beautifully with mutual aid, which is exactly why
it slipped past us in three pieces. When writing *Underground* (5), *A Mycelium and a Rhizome* (26),
or *Symbioses* (FG 6): keep the kinship, name the contested part, don't assert the wiring.

### ARLES: the rungs go in, the acronym stays out

**ARLES** is the [Stimpunks Design Method](https://stimpunks.org/design/) —
**Attention → Relational (incl. Regulation) → Lived Experience → Environment → Systems**, each
layer holding up the one above it. Read upward it is a design order; read downward, a diagnosis.
Verify against [the glossary](https://stimpunks.org/glossary/arles/), not from memory — the SLODF
crosswalk twice calls Attention and Lived Experience "the bottom two rungs" and the bottom two are
Attention and **Relational**.

**Standing rule, Ryan's, 2026-08-23: a new zine does not name ARLES.** Put the *rungs* in — in
plain words, or as spread eyebrows the way No. 59 does — and leave the acronym, the ladder diagram
and the order-claim out. The reason is the register test: a zine works by taking one settled fact
and following it until the belonging claim is already inside it, and an acronym reverses that,
asking the reader to accept a five-part model first so the fact arrives as an *illustration*. No.
59's colophon already says it — *"the argument should stand without the scaffold."*

- **The rule is going forward, not a description of the shelf.** Four pieces name ARLES in visible
  page text today and one **draws** it: No. 17 (spread 6 + colophon), No. 29 (spread 6 draws the
  ladder), No. 31 (colophon), No. 59 (colophon). They stay. Six more mention it only in card text
  or metadata. **Enumerate by extracting visible text, never by grepping source** — a `<meta>`
  description and a JSON-LD blob both match a grep and neither is on the page.
- **The argument and the spread-by-spread maps live at `the-ladder-we-dont-print.html`**, in
  *Notes & Rationale*: No. 59 (full ladder, one rung per spread, each paid for by an animal on the
  spread before), **No. 58** (its companion — same Saturday otter cam; the rung reading was in the
  *proposal* before the build, and the page names ARLES **nowhere**, not even in its ledger row),
  No. 17 (four rungs, **no Attention spread** — a real gap), No. 15 (descends to the
  floor, then climbs), No. 42 (reads downward throughout), against No. 31 (two rungs, says so) and
  No. 16 (out of order, because its claim is *about* the Environment rung). Most of the 72 numbered
  zines don't map, which the page states.
- **Enumerating ARLES mentions cannot find the pieces that matter most, and this cost a same-day
  revision.** The page shipped calling No. 59 the one piece built on the ladder; Ryan named No. 58
  the same day. A search for the word finds every piece that says it and is structurally blind to
  the piece that says nothing — which is the category the rule is *about*. **To find a zine on the
  ladder, read its spread sequence; to find one that names it, grep visible text. These are two
  different questions and only the second is greppable.** Proposals and outlines are where a rung
  reading is likeliest to be recorded, so check those too — and re-derive any mapping against the
  **shipped** spreads, since proposals drift (No. 58's merged two spreads into one after the
  proposal's rung numbers were written).
- **No gate can check any of this.** The mapping is an interpretation of our own artifacts; the page
  says so in its opening callout and its refusals. Don't quote a rung assignment from it as measured.

### The "masthead" trap (this project's signature phrase is LYDTYSS)

**The site's signature phrase is *Love You Down To Your Star Stuff*** — **73 pages** carry it in
full or as *LYDTYSS* (70 and 19 respectively, overlapping), and the **L★S** mark reaches 131. The
other registers are rarer and deliberately so: *LYSS* on 8 pages, *LUSS* on 7. Measure before
restating — `grep -lEi 'Love [Yy]ou [Dd]own [Tt]o [Yy]our [Ss]tar [Ss]tuff|LYDTYSS' *.html | wc -l`.
**The masthead tagline on `index.html` is *Cosmic Connections*.**
Neither of those is "You are made of star stuff. The universe loves you for it."

That sentence appears on the live site **once**: in the colophon of `bone-song-zine.html`, Zine
No. 1 — and there it is immediately followed by **"So do we."**, which repairs it. On 2026-08-14
No. 49 quoted it, called it *"our masthead"*, **dropped the three-word repair**, and built a
closing argument against the remainder. Ryan caught it the next day. Both halves were wrong: it is
a colophon on one zine, and the sentence had already corrected itself.

- **Why it matters, not just that it is inaccurate.** *The universe loves you for it* commits the
  naturalistic fallacy in its grammar — the universe is the subject doing the loving, and *for it*
  makes the star stuff the **reason**. **LYDTYSS has neither defect:** the implied subject is *we*,
  and *down to* measures how far the loving **reaches** rather than why it is given. The star stuff
  is the **extent** of the claim, not its warrant. *Down to is not because of.*
- **This file is how the error happened.** The sentence was a sign-off here and in `README.md`,
  and it got absorbed as house voice and promoted to site-wide doctrine without anyone checking a
  single page. Both sign-offs are now LYDTYSS. **Don't restore the old one** — and treat anything
  in these working notes as a lead about the site rather than a fact about it, the same way
  aggregators are treated for quotations.
- **`bone-song-zine.html` is deliberately unchanged.** It repairs itself in the next breath, the
  essay quotes it in full as the sentence that got it wrong, and deleting the evidence would be the
  opposite of what `changelog.html` is for. Full argument: `a-promise-not-a-finding.html`.

## Fact-checking & attribution

Every piece makes factual claims — scientific findings and attributed quotes/ideas. Getting
them right matters more than shipping fast, and you must record that you checked. See
**`FACTCHECK.md`** for the full guidelines and the per-piece ledger; the rules in brief:

- **Trace every quotation to a primary source** (the book, essay, paper, or talk) and cite
  author + title + year. Never attribute from memory.
- **Aggregators and summaries are leads, not citations.** Quote sites (Goodreads, BrainyQuote),
  Wikipedia, our own stimpunks.org glossary, and your own WebFetch/WebSearch *summaries* cannot
  be the final authority for a quote or attribution — confirm against the primary source.
  (The "inescapable network of mutuality" line was shipped misattributed to Baldwin when it is
  Martin Luther King Jr., *Letter from Birmingham Jail*, 1963 — because a secondary summary was
  trusted. Don't repeat this.)
- Distinguish a **direct quote** (verbatim, in quotation marks, verifiable) from a **paraphrase**
  (a characterization of an idea). Never dress a paraphrase as a quote.
- Attribute **coinages** to their originator precisely (shared-air space / shared-signal space →
  Helen Edgar; neuro-anarchy → Katie Munday & David Gray-Hammond; monotropism → Murray, Lesser &
  Lawson 2005).
- **Ground scientific claims** in well-established, primary/authoritative sources; flag figures as
  approximate; keep the house honesty (no naturalistic fallacy; note fragility and contested
  points — "a rhyme, not a proof").
- If you cannot verify before shipping: cut it, downgrade it to a clearly-marked paraphrase, or
  hold the piece. Do not ship an unverified claim as fact.
- **Status vocabulary:** `VERIFIED` (primary source confirmed) · `PLAUSIBLE` (idea sound, exact
  wording/citation not primary-confirmed) · `CORRECTED` · `REMOVED`.
- **Before shipping any piece:** list every quotation, named attribution, and key scientific
  claim; verify each; fix what's wrong; then log the check in `FACTCHECK.md` (piece, date, status,
  open items). **Periodically:** re-check pieces on a rolling basis, and when one source is found
  wrong, re-check its siblings for the same error.
- **Then log it publicly** in `changelog.html`, newest date section first. Three things earn an
  entry — a piece added, a piece substantially revised, or a fact-check/attribution audit —
  and typo or styling passes don't. **Name corrections plainly:** what we got wrong, what's
  right, who caught it. Publishing our own errors is the point of the page, not an embarrassment
  to bury. The `ship-zine` skill holds the markup conventions.

## Reference material (`reference/`)

Three academic sources ground the more-than-human / ecological strands of the collection. They live
in `reference/` in this repo — read them for content accuracy when writing or editing those strands:

- **`reference/144936ArticleText38818411020250323.pdf`** — **Ombre Tarragnat**, article in *TRACE*
  (2025). Critiques anthropocentrism and neuroreductionism in neurodiversity studies and proposes
  **ethodiversity / ethodivergence** (extending neurodiversity to all beings with a nervous system,
  via ethology). Basis for the ethodiversity thread in Zine No. 8.
- **`reference/Designing_multispecies_roleplaying_games_From_hum.pdf`** — **Harms, Joshi & Knauß**,
  "Designing multispecies role-playing games," *npj Urban Sustainability* (2025). Giving non-human
  beings a voice ("a folding chair") in planning.
- **`reference/hydrofeminism_or_on_becoming_a_body_of_water.pdf`** — **Astrida Neimanis**,
  "Hydrofeminism: Or, On Becoming a Body of Water." Watery embodiment and more-than-human relation
  ("we are all bodies of water"). Basis for water-themed pieces (e.g. *The Same Water*,
  *The Nearest Body*).

## Usage / licensing

Open edition — print free, share freely. If making reuse terms explicit, a Creative Commons license
(e.g. CC BY-NC-SA) fits the intent; there is no `LICENSE` file yet.

---
*Love you down to your star stuff.* **L★S**
