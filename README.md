# Star Stuff

**A collection of printable, shareable web artifacts from [Stimpunks Foundation](https://stimpunks.org/star-stuff/).**

*Love You Down To Your Star Stuff.*

---

## What this is

*Star Stuff* is a family of self-contained HTML zines, field guides, and broadsides built around a single idea stated as an act of love: **the universe doesn't pathologize its own variation.**

The framing braids two threads together. From Carl Sagan's cosmology: the calcium in your bones, the nitrogen in your DNA, the iron in your blood were all forged inside dying stars — you are, literally, star stuff. From Dr. Iwao Yasuda's 1950s discovery: bone is *piezoelectric*, a crystalline lattice that turns pressure into electrical charge, so your skeleton is quietly generating voltage with every step. Put those together under the neurodiversity paradigm and you get the through-line of the whole collection — that difference is variation, not deficit, and that a cosmos which doesn't rank its own patterns is the right scale at which to think about human minds.

Each piece here is a single HTML file with no build step and no dependencies beyond web fonts. They're made to be read on screen, embedded, or printed and handed to someone who needs one.

## The shorthand

The project's central phrase compresses through several registers, each with its own use:

| Form | Register | Use |
|------|----------|-----|
| **LYDTYSS** | full | Love You Down To Your Star Stuff |
| **LYSS** | tender | the quiet, intimate form |
| **LUSS** | punk | the loud, defiant form |
| **L★S** | visual | the logotype / mark |
| **★stuff** | reclamatory | the noun, taken back |

## The artifacts

| File | Piece | What it is |
|------|-------|------------|
| `index.html` | **Star Stuff** | Landing page and entry point to the collection. |
| `bone-song-zine.html` | **Bone Song** *(Zine No. 1)* | A paginated zine on piezoelectric bone, stellar origin, and the neurodiversity reframe, with a prose poem and colophon. Keyboard- and button-navigable spreads. |
| `underground-zine.html` | **Underground** *(Zine No. 5)* | The below to *Bone Song*'s above — a companion zine on mycelial networks, decomposition, and the quiet dark where the realest work gets done. Six spreads with a prose poem, network diagrams, a "Not:" refusals set, and reflection questions. Grounded in Stimpunks' rhizome/mycelium and "the mycelial worldview is punk." |
| `eternal-sunshine-zine.html` | **Eternal Sunshine** *(Zine No. 6)* | A golden-hour adaptation of the Eternal Sunshine page. Six spreads on the Sun as our nearest star, fusion and warmth, and the counter-deficit turn — you were never dim, the sky was — plus trust-based giving, affirmations, and the tagline "Authenticity is our eternal sunshine, and brighter days are built together." |
| `you-were-never-one-thing-zine.html` | **You Were Never One Thing** *(Zine No. 7)* | A companion to *Bone Song* on endosymbiosis: mitochondria were once free-living bacteria, so every cell is a truce between former strangers. Six spreads grounding interdependence over independence in verified cell biology (Margulis 1967; Sender, Fuchs &amp; Milo 2016), with diagrams, a prose poem, and a "Not:" refusals set. |
| `constellation-field-guide.html` | **A Field Guide to Neurodivergent Constellations** *(No. 2)* | Eight constellations renamed for what they actually are — the Stimmer, the Deep Diver, the Pattern Seeker, the Flood, the Navigator, the Bridge, the Signal, the Forge — each with real star data and expandable field notes. |
| `neurodiversity-field-guide-zine.html` | **Neurodiversity Field Guide** | The paradigm, plainly stated: variation over deficit, the DSM's gaze versus the cosmos's neutrality. Reference-card format, letterpress-friendly. |
| `ls-broadside.html` | **L★S Broadside** | A single large sheet, risograph-friendly — the shorthand in massive type, a poem/manifesto on the reverse. Made to be pinned to walls and handed out. |
| `lydtyss-zine.html` | **Love You Down To Your Star Stuff** | The core LYDTYSS statement as a zine. |
| `shorthand-evolution.html` | **Shorthand Evolution: LYDTYSS → L★S** | A typographic zine tracing the compression of the phrase, one shorthand per spread, with the etymology of each. |
| `we-are-all-star-stuff.html` | **We Are All Star Stuff — Community Reader** | Voices from the community on how different people relate to the star-stuff framing. Testimonial format, print-at-home. |
| `35407642044_c29b4f2bd7_3k.jpg` | — | Shared cosmic image asset used across the pages. *(Add credit line.)* |

## Design system

Everything shares one visual language, tuned for accessibility first:

- **Typeface:** [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next) — designed for maximum legibility and character distinction. *(Bone Song also uses Fraunces and Space Mono for its editorial voice.)*
- **Palette:** cosmic dark ground `#0a0a14`, card `#0f0f2a`, with an accent set of purple `#a78bfa`, pink `#f472b6`, gold `#fbbf24`, cyan `#22d3ee`, and green `#4ade80`.
- **Principles:** full-opacity body text (no faded grays), generous line height, `8px` card radius, a `3px` colored left border as a recurring motif, and a starfield rendered in pure CSS.

## Hosting

The collection is live at **[starstuff.earth](https://starstuff.earth/)**, deployed from this repository via **Netlify**. Everything is static with no build step, so Netlify serves the files as-is — pushing to `main` publishes the update.

`index.html` is the landing page, and every artifact is reachable at its own path (e.g. `https://starstuff.earth/bone-song-zine.html`).

To embed a piece elsewhere — such as the WordPress site — point an `<iframe>` at its URL:

```html
<iframe src="https://starstuff.earth/bone-song-zine.html"
        width="100%" height="900" style="border:none;"
        title="Bone Song — Stimpunks Zine No. 1"></iframe>
```

## Usage

Open edition. **Print free. Share freely.** These artifacts are made to be reproduced, folded, and passed along. *(If you want to make the terms explicit for reuse, add a `LICENSE` file — a Creative Commons license such as CC BY-NC-SA fits the open-edition intent.)*

## Lineage & credits

The neurodiversity paradigm language draws on the foundational work of Nick Walker and on the autistic community of InLv — Martijn Dekker, Jim Sinclair, and Autism Network International — who developed these ideas collectively in the 1990s, before the concept entered academia. The piezoelectric research traces to Dr. Iwao Yasuda (1950s), later extended by Dr. Andrew Bassett and colleagues. The cosmological framing draws on Carl Sagan's *Cosmos* and the broader popular tradition of stellar nucleosynthesis.

*You are made of star stuff. The universe loves you for it. So do we.*

**L★S**
