---
title: "Changelog · October 2026"
url: "https://starstuff.earth/changelog-2026-10.html"
updated: "2026-10-02"
description: "Everything that changed in the Star Stuff collection during October 2026 — pieces added, pieces substantially revised, and every fact-check and attribution audit, corrections to our own errors included."
licence: "CC-BY-SA-4.0"
licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"
fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"
generated_by: "tools/build-markdown.mjs, from the page's own <main> landmark"
---

[Stimpunks](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Star Stuff Changelog

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Changelog Archive

# *October* 2026

1 dated entry from October 2026 — pieces added, pieces revised, and every fact-check, corrections included. One month of [the changelog](https://starstuff.earth/changelog.html).

---

This log is backfilled from the collection's full commit history and kept up from here. It records three kinds of change: **pieces added**, **pieces substantially revised**, and **fact-check and attribution audits** — including the errors we found in our own work and exactly how we fixed them. Small typo passes and styling tweaks are left out; anything that changes what a piece *claims* is in.

Why publish our corrections

We braid real science with ideas credited to named thinkers, so the facts and the attributions have to be right. We're human, and we've gotten things wrong — a paraphrase dressed as a Sagan quote, a Martin Luther King Jr. line credited to Baldwin, a forest-wide fungal network asserted as settled fact because it rhymed so well with mutual aid. Naming those in public is part of the method, not an embarrassment to bury.

The working guidelines and the full per-piece ledger live in [FACTCHECK.md](https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md). If you spot an error, [open an issue](https://github.com/Stimpunks/Star-Stuff/issues) or reach us at [stimpunks.org](https://stimpunks.org). **Corrections are mutual aid.**

New piece Revised Fact-check Site

2026 · October 2

## Glimmer Wire, edition six: six papers read end to end, and the first story held because its only summary was written by a machine

The weekly scan behind [Glimmers](https://starstuff.earth/collection-glimmers.html), at [its own page](https://starstuff.earth/glimmer-wire-2026-10-02.html). Eight filed, six held, four seeds. Median lag 20 days, range 4 to 91 — less than a quarter of last week’s median.

NewEight filed — five verified, one contested, two plausible

**Six versions of record were read in full, which is the best this page has managed** — four at PubMed Central and two at PLOS. Graded **verified**: Sullivan, Gerstein & Kajiura in *Integrative Organismal Biology*, who flew a drone over wild blacktip sharks and found them turning away from a sound source from at least 62 m, with 71.5% of 165 responses initiated in the acoustic far field — where a shark, having no swim bladder, was long inferred to be unable to hear at all; Krzewińska *et al.* in *Science Advances*, who sequenced 142 ancient genomes from three Swedish cemeteries and found that children buried with adults were almost never closely related to them, at 12.0% of multiple burials at Västerhus and 12.5% at Sigtuna; Levy *et al.* in *Autism Research*, raising the estimated prevalence of Phelan–McDermid syndrome from 2.5–10 per million births to about 1 in 7,300 — a correction whose causes are referral rates, insurance criteria and an assay that misses half the cases; Postberg *et al.* in *Science Advances*, on 961 Cassini mass spectra showing Enceladus’ ice grains sorted into at least five salt chemistries by slow freezing and wall collisions on the way out; and Seiler *et al.* in *PLOS One*, who built a papyrus scroll, wrote on it in leaded ink, carbonised it in a low-oxygen furnace and read it back by X-ray tomography, so that an algorithm for the real Herculaneum scrolls can be marked against a known answer.

**One item is graded contested on the method rather than on our access.** The Bat1K consortium’s new bat phylogeny — 103 genomes, all 21 families, 44 pre-Quaternary fossils — places the origin of bats and of powered flight in Europe in the late Palaeocene. A continent of origin inferred from a fossil record that is best sampled in Europe is the kind of claim specialists argue over for a decade, and the paper hedges with *probably* where the coverage does not. **The headline’s “65 million years ago” is in neither the abstract nor the university’s release**, both of which say *late Palaeocene* — conventionally about 59.2 to 56.0 million years ago, so the headline is roughly six million years early and puts the origin at the Cretaceous–Palaeogene boundary rather than well after it.

**Two rest on publisher-deposited abstracts**: a revision of the Australian stick-insect genus *Anchiale* that takes two species to five while resurrecting one name from synonymy, sinking another and fixing three to designated lectotypes; and satellite tracking of nine yellow-morphotype green turtles in the Galápagos, none of which left the archipelago, and whose home ranges are “highly variable among individuals” by a spread roughly twice their own mean.

Fact-checkA new kind of refusal: a fluent summary, correctly labelled, written by a language model

**Where a publisher elides an abstract, Semantic Scholar’s API returns `"abstract": null` and, in the same object, a `tldr` field holding fluent, specific, paragraph-shaped prose about the paper, generated by a language model.** The archive names the model, which is to its credit and is the whole defence. For the *Nature* paper arguing that Cretaceous zhelestid mammals are zalambdalestoids — a group read for forty years off its teeth and reassigned on a nearly complete Gobi skeleton — that text was the only summary reachable from here, Crossref deposits none and `nature.com` is refused. **It is not a source, and nothing about its shape says so.** We did not quote it; the story is held rather than filed, and the page says why. *A status code is not a source, a byte count is not a page, and a well-formed field in the right place is not an abstract.*

**Two holds turn on a number rather than a word, and in one of them the dropped figure is the one we would have led with.** A *PLOS Medicine* study scoring brain ageing across nine conditions reports Alzheimer’s at *d* = 0.97 and tobacco use disorder at 0.72 — and autism at *d* = 0.06 (*p* = 0.36) and ADHD at 0.01 (*p* = 0.98), which is no difference at all. Its own abstract opens “PAD was consistently greater across disorders” and reaches those two exceptions four clauses later; the headline keeps the opening. **We held it anyway**, because filing it would mean accepting a predicted-age-difference as a measure of brain health in order to enjoy a null, and a page does not get to switch instruments depending on the answer. And a *Psychological Medicine* meta-analysis ran as “cannabis users were twice as likely to commit violence”: the factor of two is its cross-sectional figure, while its longitudinal estimate — the only design that can speak to order in time — is OR 1.17.

**The other three holds: a review, a date and a route.** A *Biomolecules* paper carried as a finding about mulberry and gut bacteria is a narrative review of preclinical models, and its own verbs say so. A MIND-diet cohort result ran on 30 September having been published on **17 March** — a lag of **197 days**, longer than every filed item on the page — and its “2.5 years” is an equivalence computed from a grey-matter volume slope, not a measurement of brain age. And a *Nature* paper on 1.75-to-1.4-billion-year-old eukaryote fossils is held because the only abstract we could obtain came from a third-party index rather than the publisher, and because its mitochondria claim is explicitly an inference from where the fossils occur.

SiteWhat refused, three open-access papers we could not open, and a shallow clone caught before it shipped

**Two host behaviours repeated from last week, exactly.** A wrong search path at PubMed Central again returned the PMC home page at `HTTP 200` — **67,236 bytes, the identical figure recorded on 25 September**, for four different queries a week apart. And PMC again served Google’s `reCAPTCHA` at `200` for every article on the first attempt; a retry with a different user agent returned all four papers in full. `export.arxiv.org` was refused while `arxiv.org` answered, as last week.

**Refused at the network layer, named on the page:** `nature.com`, `frontiersin.org`, `academic.oup.com`, `onlinelibrary.wiley.com`, `doi.org`, `export.arxiv.org`, `ncbi.nlm.nih.gov`, Europe PMC at both addresses, OpenAlex and Unpaywall. `science.org` answered with a real `403` and `biorxiv.org` with a `429`. **Three of this week’s refusals sit in front of openly licensed papers** — the CC BY stick-insect revision, the CC BY turtle tracking and the CC BY bat phylogeny — which is the third consecutive week an open-access paper could not be opened from here. An open licence is a permission, not a road.

**The shallow-clone fault from last week was checked for before anything was generated, and it was present.** This checkout arrived with **50 commits** of history rather than 461, and the test recorded on 25 September — ask `git log --diff-filter=A` for the creation date of *Bone Song* — returned **2026-09-12** instead of 2026-07-17. `git fetch --unshallow` first, generators afterwards; the derived files were never written against the truncated history. *Last week this cost a 1,463-line diff that every gate passed. This week it cost one command, because the lesson had been written down.*

**One fault caught before publishing, and it is the third instance of the same one.** The first draft of this edition’s collection and front-page cards used `<span class="mono">` for a status code — and neither [the front page](https://starstuff.earth/index.html) nor [the collection page](https://starstuff.earth/collection-glimmer-wire.html) defines `.mono`, so the text would have rendered in the body face with nothing to show for the markup. `check-classes` named it on both pages. The ledger already records this against edition four’s collection card and edition five’s changelog entry; *a gate catching the same mistake three times is the gate working and the author not learning*, and the fix is the same both previous times: `<code>`, which every page styles.

**A new month is a new file.** This entry opens [the October archive page](https://starstuff.earth/changelog-2026-10.html), copied from September with its `<title>`, canonical, `meta`, `og:`, `twitter:` and JSON-LD all rewritten for the month, prev/next edited on both pages, a sitemap row added and [the index](https://starstuff.earth/changelog.html) rebuilt from the month pages.

**Wired in:** a card on [the collection page](https://starstuff.earth/collection-glimmer-wire.html) and on the front page, prev/next edited on both editions, a sitemap entry, and the collection’s prose counts re-derived by summing the six edition tallies rather than incremented — **six editions, forty-three filed, thirty held, seventeen verified**.

[Browse the collection →](https://starstuff.earth/index.html)

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · [starstuff.earth](https://starstuff.earth) · [stimpunks.org](https://stimpunks.org) · [morerealms.com](https://morerealms.com) · [Source on GitHub](https://github.com/Stimpunks/Star-Stuff)
 Print freely · Share freely · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · L★S · You were ★stuff all along
