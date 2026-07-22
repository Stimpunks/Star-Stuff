# Fact-checking & attribution — Star Stuff

Star Stuff pieces braid real science with attributed ideas from named thinkers and from our own
community. That only works if the facts and the attributions are right. This file holds the
guidelines and the per-piece ledger. The behavior rules are mirrored in `CLAUDE.md` so every
working session follows them.

*These are living documents. Fact-checking here is ongoing, not finished. If you spot an error or a
misattribution, please open an issue at <https://github.com/Stimpunks/Star-Stuff/issues> or reach us
at <https://stimpunks.org> — and we'll fix it.*

## Guidelines

### Attribution

- **Primary sources only.** Trace every quotation to the book, essay, paper, or talk it came from,
  and cite author + title + year. Never attribute from memory.
- **Aggregators and summaries are leads, not citations.** Quote sites (Goodreads, BrainyQuote,
  QuoteFancy), Wikipedia, our own stimpunks.org glossary, and any AI/search *summary* can point you
  toward a source but cannot be the source. Confirm the wording and the author against the primary
  text before it ships.
  - *Why this rule exists:* "We are caught in an inescapable network of mutuality" was shipped in
    the Symbioses field guide attributed to **Baldwin**. It is **Martin Luther King Jr.**, *Letter
    from Birmingham Jail* (1963). The error came from trusting a secondary summary. Helen Edgar's
    fact-check caught it.
- **Quote vs paraphrase.** A direct quote is verbatim, in quotation marks, and verifiable. A
  paraphrase characterizes someone's idea in our words. Never present a paraphrase as a quote.
- **Coinages** get their originator, precisely:
  - shared-air space, shared-signal space → **Helen Edgar** (with Ryan Boren)
  - neuro-anarchy → **Katie Munday** & **David Gray-Hammond**
  - the Autistic Rhizome → **David Gray-Hammond** / **Helen Edgar** (building on Deleuze & Guattari)
  - monotropism → **Murray, Lesser & Lawson (2005)**
  - double empathy → **Damian Milton (2012)**
- **When unverified:** cut it, mark it clearly as paraphrase, or hold the piece. Never ship an
  unverified claim as fact.

### Scientific claims

- Begin from well-established science; prefer primary or authoritative sources. Flag figures as
  approximate ("~", "roughly"). Keep the house honesty: no naturalistic fallacy, and name fragility
  or contested interpretations. As `about.html` puts it: *we are noticing a rhyme, not collecting a
  proof.*

### Status vocabulary

| Status | Meaning |
|--------|---------|
| `VERIFIED` | Confirmed against a primary/authoritative source. |
| `PLAUSIBLE` | The idea is sound and consistent with the author's work, but exact wording or a specific citable source was not primary-confirmed in this pass. |
| `CORRECTED` | An error was found and fixed (note what). |
| `REMOVED` | Claim/quote cut because it couldn't be supported. |

### Process

- **Per piece, before shipping:** list every quotation, named attribution, and key scientific
  claim; verify each to a primary source; fix what's wrong; log it below.
- **Periodically, across the repo:** re-check pieces on a rolling basis. When one source is found
  wrong, re-check its siblings for the same error (shared quotes travel between pieces).

## Ledger

Date format YYYY-MM-DD. "Checked" = a full attribution + key-claim pass was done.

### Zines

| No. | Piece | Checked | Status | Notes / open items |
|----|-------|---------|--------|--------------------|
| 1 | Bone Song | — | pending first check | |
| 2 | Love You Down To Your Star Stuff (LYDTYSS) | — | pending first check | |
| 3 | Neurodiversity Field Guide | — | pending first check | |
| 4 | We Are All Star Stuff | — | pending first check | |
| 5 | Underground | — | pending first check | |
| 6 | Eternal Sunshine | — | pending first check | |
| 7 | You Were Never One Thing | — | pending first check | endosymbiosis (Margulis); mitochondria — verify on next pass |
| 8 | The Universe Runs on Difference | — | pending first check | |
| 9 | The Lines We Drew | — | pending first check | |
| 9b | The Difference-First Frame (backing material) | — | pending first check | |
| 10 | The Dead Stars Still Reach Us | — | pending first check | |
| 11 | Why Difference Comes First (Helen Edgar) | — | pending first check | |
| 12 | Turn and Face the Strange (Bowie) | — | pending first check | song/lyric attributions — check carefully |
| 13 | Warriors and Weirdos (Aurora) | — | pending first check | |
| 14 | The Council of All Beings | — | pending first check | Joanna Macy attribution — verify |
| 15 | Every Creature's Own Sky | — | pending first check | umwelt (von Uexküll); double empathy (Milton 2012) |
| 16 | Minor Worlds | — | pending first check | niche construction — verify |
| 17 | The Nearest Body | — | pending first check | tides/co-regulation science |
| 18 | The Garden and the Stars | — | pending first check | |
| 19 | No Universal Now | — | pending first check | relativity; crip time (Kafer, Samuels, Price) — verify |
| 20 | The Same Water | — | pending first check | phase-transition physics; Cynthia Kim; Tarragnat |
| 21 | Not a Line | — | pending first check | spectrum/constellation (Dwyer; Edgar) |
| 22 | No One Is the Leader | — | pending first check | Anderson "More Is Different" (1972); Ballerini/STARFLAG — verify |
| 23 | Bodies of Water | 2026-07-22 | VERIFIED | Neimanis (*Hydrofeminism*; *Bodies of Water*), Alaimo (transcorporeality), gestationality, ~60% water, monotropism (Murray, Lesser & Lawson 2005), Autistic Realms shared/collective flow (Edgar), water older than the Sun — all confirmed. No corrections. |
| 24 | Shared Air | 2026-07-22 | CORRECTED → VERIFIED | Fixed solarpunk attribution: "a future with a human face and dirt behind its ears" is **Adam Flynn**, *Solarpunk: Notes toward a manifesto* (2014); "move quietly and plant things" is a movement slogan (**Andrew Dana Hudson**), not the manifesto. Verified: Great Oxidation Event (~2.4 Gya), stellar O/N, Corsi–Rosenthal box, brown *Emergent Strategy* (2017). Shared-air space coinage → Helen Edgar & Ryan Boren. |
| 25 | Shared Signal | 2026-07-22 | CORRECTED → VERIFIED | Fixed Streuber et al. (2026, *Scientific Reports*): the study found VR remote synchrony **comparable to** face-to-face — earlier text wrongly said "weaker over video." Verified: Porges (2011), Howard & Sedgewick (2021, "Anything but the phone!"), Milton (2012), Deleuze & Guattari (1987), Edgar (*Autistic Rhizome*, 2026), EM-spectrum physics. Coinage → Helen Edgar. |
| 26 | A Mycelium and a Rhizome | 2026-07-22 | VERIFIED | Deleuze & Guattari quote ("a model … perpetually in construction or collapsing," *A Thousand Plateaus*, Rhizome intro) confirmed; neuro-anarchy & Autistic Rhizome (Gray-Hammond, Munday); Simard (wood wide web); Tero et al. (2010, *Science*, slime mold / Tokyo rail); cosmic web. No corrections. |

### Field Guides

| No. | Piece | Checked | Status | Notes / open items |
|----|-------|---------|--------|--------------------|
| 1 | Neurodivergent Constellations | — | pending first check | |
| 2 | The Star Stuff You're Made Of | — | pending first check | element/nucleosynthesis figures |
| 3 | Life in Impossible Places | — | pending first check | extremophile biology |
| 4 | Worlds That Work by Other Rules | — | pending first check | |
| 5 | The Ways of Being a Star | — | pending first check | H–R diagram; stellar figures (already flagged approximate) |
| 6 | Symbioses | 2026-07-22 | CORRECTED → VERIFIED | Helen Edgar fact-check applied. Fixed MLK/Baldwin misattribution (King, *Letter from Birmingham Jail*, 1963). Cited Kropotkin (*Mutual Aid*, 1902), Margulis (*Microcosmos*, 1986), Spade (*Mutual Aid*, 2020), Kafai ("cripped, queered, decolonial survival work," *Crip Kinship*, 2021), Piepzna-Samarasinha ("revolutionary love without charity," *Care Work*, 2018). Added Monotropa uniflora as the honest asymmetrical (myco-heterotroph) case + cross-link to Edgar's *Monotropa uniflora and Monotropism*. Biology of all 12 partnerships confirmed. Mingus & Talila A. Lewis: `PLAUSIBLE` — paraphrase attributions consistent with their published work; exact citable source not primary-confirmed this pass. |

### Other pieces (non-numbered)

| Piece | Checked | Status | Notes |
|-------|---------|--------|-------|
| Manifesto | — | pending first check | |
| Inclusion Safety — A Star Stuff Creed | — | pending first check | |
| Love You Down To Your Star Stuff (page) | — | pending first check | |
| L★S Broadside | — | pending first check | |
| L★S Playlist | — | pending first check | track/credit attributions |
| Shorthand Evolution | — | pending first check | |

## Open items

- Primary-confirm exact citable sources for **Mia Mingus** (independence-as-myth) and **Talila A.
  Lewis** (self-care birthed through community care) quotes/paraphrases used in Symbioses (currently
  `PLAUSIBLE`).
- Helen to add a reciprocal "companion piece → Field Guide" link on the *Monotropa uniflora and
  Monotropism* post at morerealms.com (outside this repo).
- Continue rolling first-check passes on the pending zines and field guides above, prioritising the
  most attribution-dense.
