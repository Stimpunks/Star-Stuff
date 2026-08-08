# CLAUDE.md — Star Stuff

Guidance for Claude Code working in this repository.

## What this project is

**Star Stuff** (live at **https://starstuff.earth/**) is a collection of printable, shareable
web artifacts from the **Stimpunks Foundation** — a family of self-contained HTML zines, field
guides, and broadsides built around one idea, stated as an act of love: *the universe doesn't
pathologize its own variation.*

The framing braids two threads: Carl Sagan's cosmology (the atoms in your body were forged in
dying stars — you are, literally, star stuff) and Dr. Iwao Yasuda's 1950s finding that bone is
*piezoelectric* (your skeleton turns pressure into charge). Read through the neurodiversity
paradigm, the through-line is that difference is variation, not deficit.

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
- Include full head metadata like the existing pages: canonical URL, description, Open Graph +
  Twitter card tags pointing at `og-card.jpg` (1200×630), and JSON-LD `Article` schema attributing
  Stimpunks Foundation.
- Paged zines: include `<script src="starstuff.js"></script>`, expose a global `changePage(dir)`,
  and structure spreads as `.spread` (with a `.spread.active`), each with a `.spread-footer`
  containing a `.spread-footer-right` page counter. IDs run `spread-1..N` in document order.

## Search (`search.html` + `search-index.json`)

Client-side search over the whole collection. No dependencies, no server, no
tracking — the query never leaves the reader's browser.

- **`search-index.json` is a committed build artifact, and it goes stale.** Regenerate it
  whenever page *text* changes and commit it alongside:

  ```bash
  node tools/build-search-index.mjs          # rewrites search-index.json
  node tools/build-search-index.mjs --check  # non-zero exit if stale; writes nothing
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
- **Netlify does not run it.** Still no build step; the script is a local dev tool.
- **Granularity is the point.** One record per zine spread (`#spread-N`) and per field-guide
  entry (`#entry-slug`), so a result lands on the passage rather than the top of a long page.
  Pages that are a flat run of headings are chunked per heading, falling back to a
  `#:~:text=` fragment where a heading has no `id`.
- `starstuff.js` opens a deep-linked field-guide entry (they render collapsed), so a result
  doesn't land on a closed card with the matched text still hidden.
- **Don't add `cache: 'force-cache'` to the index fetch.** It pins the first copy a visitor
  ever loaded, so they keep querying a stale index forever. Plain `fetch` lets Netlify's ETag
  revalidate.
- Every page reaches search through the `.ss-nav-search` pill in the nav cluster; `index.html`
  has no `.ss-nav`, so it carries its own `.masthead-search` link.

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
  handled separately in the shared sheet. **Verify, don't assume:** emulate print media and check
  computed text color against white, or render the sheet and sample pixels. A stated principle
  nobody measures is a wish. Full account: `design.html`.

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
