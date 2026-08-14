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

  All 84 members have one; the 13 collection pages, `index.html` and `search.html` do not. **A new
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
- `index.html` carries a **`.masthead-toc` jump strip** — two tiers, seven top-level sections then
  the five register collections, each tinted with the same `--sec-accent` its heading and rule
  carry. **A new top-level section on the index needs a pill here**, and the strip is in
  `CHROME_SEL` (its names are already indexed as the headings they point at) and hidden in
  `@media print` (fragments mean nothing on paper, and the hardcoded accents would land at 1.6:1
  on white).
- Paged zines: include `<script src="starstuff.js"></script>`, expose a global `changePage(dir)`,
  and structure spreads as `.spread` (with a `.spread.active`), each with a `.spread-footer`
  containing a `.spread-footer-right` page counter. IDs run `spread-1..N` in document order.

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
  same `FACTCHECK.md` row, same changelog entry, same five gates. Only the door moves. And eggs stay
  inside `sitemap.xml`, `search-index.json` and every gate, because a page the checks cannot see is
  a page that rots.

**Five sort by register** — what kind of argument a piece is making:

| Collection | Register | Members (zine numbers) |
|------------|----------|------------------------|
| **Star Stuff** | One settled, checkable fact, followed honestly, already contains the belonging claim | 1, 2, 6, 7, 8, 9, 10, 17, 19, 20, 21, 23, 24, 25, 44 |
| **Star Gazing** | Experimental, neuroqueer, wonder-forward — possibility, not proof | 11, 22, 26, 28, 29, 30 |
| **More Than Human** | Umwelt, multispecies, ethodiversity; de-anthropocentrized | 5, 14, 15, 16, 27 |
| **Kin** | Citation-dense natural history with a neurodivergence moral | 31, 32, 33, 34, 35, 36 |
| **Stars We Grew Up On** | Culture and icon; owns the star-as-celebrity sense | 12, 13 (+ playlist, broadside in spirit) |

**Four do not**, and each says so on its own face rather than letting it read as an oversight —
that disclosure is the convention, and **How We Got Here duly carries it too**:

| Collection | Axis | Members |
|------------|------|---------|
| **Field Guides** | **form** — a catalogue of same-shaped entries, none ranked | Field Guides 1–12 (134 entries; 139 cards counting the five *turtles people made*, which FG 10 deliberately does not file as entries) |
| **How We Got Here** | **form** — a Burke chain, one link per spread, joints marked | 38, 39, 40, 41, 42, 43 |
| **Print** | **medium** — paper | 8 broadsides + 2 that are not broadsides (a typographic specimen, and a blank sheet) |
| **Sound** | **medium** — audio | 4 racks, 121 cards / 117 distinct songs |

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
| **Foundations** | what the rest presupposes | `manifesto`, `inclusion-safety-creed`, `too-good-to-check`, No. 3, No. 18 |
| **Notes & Rationale** | the working papers | `changelog`, `design`, `print-design`, `difference-first-frame` |

- **Notes & Rationale is the only collection page outside the prev/next chain**, because all four
  of its members are. Threading a changelog or a design system into a reading sequence would put a
  maintenance document between two zines. Its `.ss-nav` therefore carries **only the home group**,
  no prev/next — the same shape `about.html` and `cosmic-connections.html` use. If a future
  collection's members all sit off the chain, copy that shape rather than inventing a link.
- **Field Guides sort by form, and that cuts across register on purpose.** FG 2 is settled physics
  and FG 1 is frank invention, and they are the same kind of object. Seven of the twelve arrive
  independently at *there is no standard {star, nervous system, migration, shark, turtle, tortoise,
  galaxy}*
  — verify by grep before restating the count, it grows.
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
- **Three numbered pieces are deliberately outside the *register* collections**: No. 3 (paradigm
  primer) and No. 18 (self-portrait of the project) sit in [*Foundations*](collection-foundations.html);
  No. 4 (open call for contributors) sits in [*Start Here*](collection-start-here.html). They keep
  their numbers — this is the sharpest case of *the number says when, the collection says what*
  disagreeing, and both collection pages explain it on their face rather than leaving it to look
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
  members run in ascending number within the collection. **86 pages** as of 2026-08-14,
  `collection-start-here.html` → `shorthand-evolution.html`. Outside the chain by decision:
  `about.html` and `cosmic-connections.html`; **all of Notes &amp; Rationale** — `changelog.html`,
  `design.html`, `print-design.html`, `difference-first-frame.html` and `collection-notes.html`;
  and **all of Easter Eggs** — `collection-easter-eggs.html`, `out-of-order-zine.html`,
  `true-facts-zine.html` and `watching-animals-field-guide.html`, because a chain link would walk a
  reader into an egg by accident and stop it being one.
  (`index.html` and `search.html` are utility pages and were never in it.)
  **Don't trust that number — measure it**, and check `prev` and `next` agree in both directions;
  inserting a page means editing its two neighbours, and a one-sided edit leaves a chain that walks
  forward correctly and breaks going back:

  ```bash
  node -e "const fs=require('fs');const nx={},pv={};for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){const s=fs.readFileSync(f,'utf8');let m=s.match(/ss-nav-next\"[^>]*href=\"([^\"]+)\"/);if(m)nx[f]=m[1];m=s.match(/ss-nav-prev\"[^>]*href=\"([^\"]+)\"/);if(m)pv[f]=m[1];}let c='love-you-down-to-your-star-stuff.html',ch=[],seen=new Set();while(c&&!seen.has(c)){seen.add(c);ch.push(c);c=nx[c];}console.log('chain',ch.length,'· mismatches',ch.filter((c,i)=>i>0&&pv[c]!==ch[i-1]).join(',')||'none','· missing',ch.filter(c=>!fs.existsSync(c)).join(',')||'none');"
  ```

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
- **Granularity is the point.** One record per zine spread (`#spread-N`) and per field-guide
  entry (`#entry-slug`), so a result lands on the passage rather than the top of a long page.
  Pages that are a flat run of headings are chunked per heading, falling back to a
  `#:~:text=` fragment where a heading has no `id`.
- **Coverage is checked, not assumed.** The generic chunker matches a page's repeating unit
  (`section`, `.card`, `.entry`, `.scale`, `.lp-card`), and a page whose repeating unit holds
  almost none of its prose used to sail through: `about.html` has exactly three `.scale` blocks, so
  a `records.length < 3` gate saw "3 records, fine" and shipped **12% of the page**. Fixed
  2026-08-08 by measuring instead of counting — each page's records are compared against
  `textOf(main)`, and below **`COVERAGE_FLOOR` (0.9)** the extractor re-segments by heading, then
  appends a remainder record for anything still unclaimed. The run now prints a coverage
  percentage per page and a warning list at the end, because *a page that indexes 12% of itself
  looks exactly like a healthy one if all you print is the record count.* **If a new page reports
  under 100%, give it real headings or add its container to the chunk selector — don't ignore it.**
- **Duplicate presentations get stripped, not indexed twice.** `ls-playlist.html` lists every song
  as a `.lp-card` (with the note explaining it) *and* again as a flat `.lp-row` link list; the rows
  are in `CHROME_SEL`. The co-brand eyebrows (`.nav-brand`, `.hero-eyebrow`, `.masthead-eyebrow`,
  `.cover-issue`) are stripped for the same reason — the pairing is on all 79 pages, so as an
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
- **The one decorative exemption: `.cover-corner-num`.** The ghosted numeral on 40 zine covers
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
    40 numerals were marked in the same pass, which also stopped screen readers announcing a bare
    "30" before the title.

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
  79 pages and 50,000 tags in about 0.3s.
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
  until 2026-08-13, when that one reached zero too — all five gates now hold at 0.) It was
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

- **It exists because `sitemap.xml` is hand-maintained and nothing looked at it.** The other four
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
*You are made of star stuff. The universe loves you for it. So do we.* **L★S**
