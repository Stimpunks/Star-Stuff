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

## Design system

- **Typeface:** Atkinson Hyperlegible Next (max legibility). *Bone Song* also uses Fraunces and
  Space Mono for editorial voice; the injected footer nav uses Space Mono.
- **Palette** — the canonical tokens live in `starstuff.css` as `:root { --sp-* }` (single source
  of truth). Pages alias them inline (e.g. `--purple: var(--sp-purple)`); introduce a new shared
  color by adding a `--sp-` token there, not by hardcoding a hex across pages:
  - void/ground `#0a0a14`, deep/card `#0f0f2a`
  - purple `#a78bfa`, pink `#f472b6`, gold `#fbbf24`, cyan `#22d3ee`, green `#4ade80`
  - white `#f9fafb`, secondary `#b8aed0`, muted `#c4b5d4`
- **Principles:** full-opacity body text (no faded grays), generous line height, `8px` card
  radius, a recurring `3px` colored left border, and a pure-CSS starfield.
- **Accessibility first.** `starstuff.css` already honors `prefers-reduced-motion` (neutralizes
  twinkle/spin/fade/smooth-scroll) and hides nav in `@media print`. Keep artifacts
  keyboard-navigable and print-friendly — they're meant to be printed and handed to people.

## Voice & editorial conventions

- **Refer to neurodivergent and disabled people in the first-person plural — we / us / our — not
  third person (they/them/their).** We write from within the community, not about it. Second person
  (you / your) is fine when directly addressing the reader.
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

## Reference material (in the Claude.ai project, not this repo)

Three academic sources ground the more-than-human / ecological strands of the collection. Use them
for content accuracy; they are not files in the repo:

- **Ombre Tarragnat**, article in *TRACE* (2025) — critiques anthropocentrism and neuroreductionism
  in neurodiversity studies and proposes **ethodiversity / ethodivergence** (extending neurodiversity
  to all beings with a nervous system, via ethology). Basis for the ethodiversity thread in Zine No. 8.
- **Harms, Joshi & Knauß**, "Designing multispecies role-playing games," *npj Urban Sustainability*
  (2025) — giving non-human beings a voice ("a folding chair") in planning.
- **Astrida Neimanis**, "Hydrofeminism: Or, On Becoming a Body of Water" — watery embodiment and
  more-than-human relation ("we are all bodies of water"). Basis for water-themed pieces
  (e.g. *The Same Water*, *The Nearest Body*).

## Usage / licensing

Open edition — print free, share freely. If making reuse terms explicit, a Creative Commons license
(e.g. CC BY-NC-SA) fits the intent; there is no `LICENSE` file yet.

---
*You are made of star stuff. The universe loves you for it. So do we.* **L★S**
