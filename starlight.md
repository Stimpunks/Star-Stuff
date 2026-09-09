---
title: "Starlight: Making in the Open in the Shine of the Cosmic Latte"
url: "https://starstuff.earth/starlight.html"
updated: "2026-08-17"
description: "Starlight: making in the open, in the shine of the cosmic latte. Average the light of 200,000 galaxies and you get a warm off-white someone named cosmic latte — and the first answer was pale turquoise, wrong because of a white point, and corrected in public by the astronomers who got it wrong. That is the argument for an open repository, lit in the colour we borrowed. This essay states plainly what is public here (the pages, the ledger, the errors, the reasoning, the checking) and what deliberately is not (your search query). It gives a high-level account of the six automated gates — what each one asks, what shipped broken to create it, and what it structurally cannot see — and of the division of labour behind them: machines hold ground, people take it. Every gate here was written after a person found the fault. Includes the first plain statement of how generative AI is used on this site, what it is never allowed to do, and why the house rule against smoothed retellings is the reason the gates exist at all."
collection: "Foundations"
licence: "CC-BY-SA-4.0"
licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"
fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"
generated_by: "tools/build-markdown.mjs, from the page's own <main> landmark"
omitted_diagrams: 2  # inline <svg>, decoration on this page — the HTML is the artifact
---

[Stimpunks](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Starlight

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Foundations

# Star*light*

Making in the open, in the shine of the cosmic latte

This repository is public — every page, every tool, every error. The reason is one sentence of Brandeis's, and one colour that had to be corrected in public before anybody could use it.

---

Average the light of two hundred thousand galaxies and you get a colour. It is a warm off-white, and somebody reading the newspaper over a coffee named it **cosmic latte**.

That is the fact this page is named after, and it is not the interesting half. The interesting half is that **the first answer was wrong, and the astronomers said so out loud.**

## The colour of the universe is a correction

The colour was never the point. Ivan Baldry, Karl Glazebrook and the 2dF Galaxy Redshift Survey team were measuring the *cosmic spectrum* — the volume-averaged light of present-day galaxies — to constrain how fast the universe used to make stars. What colour that spectrum would look like to a human eye was a **footnote**. Footnote 3, to be exact, and you can still read the original on arXiv:

“Integrating these through the cosmic spectrum we have computed RGB values of 0.269, 0.388, 0.342. This corresponds to a blue-green color, the closest match in standard RGB color lists… is ‘pale turquoise’.”

Baldry, Glazebrook et al. · astro-ph/0110676 · footnote 3, as posted

It travelled. *The universe is turquoise* is a lovely sentence and it went everywhere, which is how it reached Rochester, New York, and the desks of people who do colour for a living. They spotted the problem in the arithmetic that turns a spectrum into a colour: the software had been handed the wrong **white point**.

A white point is the colour your eye has decided counts as white, and it is not a property of the light being measured — it is a property of *where you are standing*. Tungsten bulbs push it yellow. A monitor pushes it blue. The program had been set to a reddish white, and anything measured against a reddish white looks green by comparison. The galaxies had not moved. The observer had.

Within weeks the team put out the correction themselves. Two sentences from Glazebrook in that announcement are the reason this page exists:

“It's our fault for not taking the color science seriously enough. I'm very embarrassed.”

“I don't like being wrong, but once I found out I was, I knew I had to get the word out.”

Karl Glazebrook · Johns Hopkins University announcement, 13 March 2002

Corrected, the colour is a beige-white. NASA's *Astronomy Picture of the Day* describes it with a care worth stealing: **“a conditionally perceived shade of beige.”** Not *is* beige. *Conditionally perceived* as beige — by an eye, adapted to a particular dark, standing somewhere.

Then they ran a naming contest. *Skyvory* and *univeige* were among the entries. **Cosmic latte** won.

*Figure 1 · the retracted colour and the published one, and the knob between them*

Marking the rung

**#FFF8E7 is not a constant of nature.** It is one sRGB rendering of a colour that only exists relative to an observer — which is the same thing the astronomers said, in the words “conditionally perceived.” The sample is around two hundred thousand galaxies in one survey's volume, not every star there is. And the colour *moves*: APOD notes the cosmic spectrum has grown much less blue over the past ten billion years as redder stars became more common.

We are painting this page in it anyway, and saying all of that out loud, because [a simplification is honest exactly where it marks where it stops](https://starstuff.earth/a-promise-not-a-finding.html).

So the most-shared fact about the colour of the universe is **an erratum**. The reason anyone can trust the number is that the people who got it wrong put the correction where the mistake had been, under their own names, before the journal version went out. It cost Glazebrook an afternoon of being embarrassed in public and it bought everyone since a usable answer.

That is the entire argument for working in the open, and it happens to be lit in the exact colour we are borrowing.

## “Sunlight is said to be the best of disinfectants”

The line everybody quotes is Louis D. Brandeis's, from a Harper's Weekly essay of 20 December 1913 that became chapter five of *Other People's Money and How the Bankers Use It*. Two things go missing every time it is repeated, and both are worth having back.

“Publicity is justly commended as a remedy for social and industrial diseases. Sunlight is said to be the best of disinfectants; electric light the most efficient policeman.”

Louis D. Brandeis · “What Publicity Can Do” · Harper's Weekly, 20 December 1913

The first missing piece is the second clause. **Sunlight and electric light are doing two different jobs** — one kills what is already there, the other deters what would otherwise arrive. A public changelog is sunlight: it cleans up what we already got wrong. A public repository is the electric light: it changes what we are willing to write in the first place, because somebody can read the diff.

The second missing piece is smaller and, for a project with a [fact-checking ethic](https://starstuff.earth/too-good-to-check.html), more interesting. Brandeis did not write *sunlight is the best of disinfectants*. He wrote **“is said to be.”** He was passing on a proverb and marking it as one. The most quoted sentence in the literature of transparency is itself hedged by its author, and the hedge is the first thing a century of quoting filed off.

## What “open” means here, in nouns

Open is a word that survives being meant loosely, so here it is as a list of things that exist and can be checked. Every one of these is in the same public git repository as the pages themselves, at the same commit.

*the artifact, and where its working is kept*

| what you can read | where the working is |
| --- | --- |
| **115 pages** — zines, field guides, broadsides, essays | the repository, and every revision of every one of them |
| **the claims** | `FACTCHECK.md` — 114 pieces logged, 122 items `VERIFIED`, 24 `CORRECTED`, 19 `PLAUSIBLE`, 1 `REMOVED` |
| **the errors** | [the changelog](https://starstuff.earth/changelog.html) — 21 dated releases, 169 entries, **50 of them fact-checks**, each naming what was wrong, what is right, and who caught it |
| **the reasoning** | `DECISIONS.md`, plus [the design system](https://starstuff.earth/design.html) and [the print rationale](https://starstuff.earth/print-design.html) as public pages |
| **the checking** | `tools/` — six gates, about 2,850 lines, runnable by anyone with a browser and Node |
| **the search** | `search-index.json`, a committed build artifact — 1,270 records across 114 pages |
| **the licence** | CC BY-SA 4.0. Print it, copy it, hand it to somebody |

**One thing is deliberately closed, and it belongs in the same list.** [Search](https://starstuff.earth/search.html) runs entirely in your browser against that committed index. There is no server to send a query to, no analytics on it, and no log of it anywhere. We are open about our work; we are not curious about yours. Openness that only ever flows one way — institutions private, readers observed — is the ordinary arrangement, and inverting it is the point.

## The machines

Six automated gates check this site. None of them was planned. **Every one exists because something shipped broken and a person found it** — which turns out to be the most important sentence in this section, and we will come back to it.

*six gates · what each asks, and what made it necessary*

| the gate | the question | the fault that created it |
| --- | --- | --- |
| **contrast** `check-contrast.mjs` | *What colour is it — on screen, and on paper?* | Browsers leave *background graphics* off by default, so a light-on-dark page prints blank. **44 of 46 pages did.** Nobody noticed until somebody pressed print. |
| **markup** `check-markup.mjs` | *What shape is the tag tree?* | Four links nested inside a link on a collection page. Anchors cannot nest, so the parser closed the outer one early and the cards came apart on the live site. |
| **collision** `check-overlap.mjs` | *Where is it?* | One zine shipped with three pieces of text sitting on top of other text. **All five other gates passed it**, and none of them was wrong to. |
| **sheets** `check-sheets.mjs` | *Does it fit the paper?* | A broadside describing itself on its own face as “a two-sided single sheet” printed as three sides on US Letter. |
| **sitemap** `check-sitemap.mjs` | *Does the sitemap agree with the filesystem?* | A live zine, linked from the front page, that had **never been listed** — uncrawlable for weeks — and a broadside listed twice. |
| **search index** `build-search-index.mjs` | *Is every word findable?* | A page whose text was indexed at **12%** and which passed the coverage check, because the check counted records instead of measuring words. |

The gates are only half the story. What each failure taught is the other half, and those lessons are now the operating rules of this repository.

### Measure, don't count

The search indexer used to check its own work by counting records: *did this page produce at least as many chunks as it has sections?* [One page](https://starstuff.earth/about.html) has exactly three of the blocks it was chunking on, produced three records, and shipped **12% of its own text** into the index looking perfectly healthy. Now every page's records are measured against that page's actual words, and anything under 90% gets re-segmented and a remainder record appended. The run prints a percentage per page, because *a page that indexes an eighth of itself looks exactly like a clean one if all you print is a count.*

### Wait on a condition, never a clock

Two of these tools drive a headless browser, and both used to wait a flat 1.3 seconds for a page to render before reading it. That makes every run a race. On 11 August the indexer lost it: one build produced **629 records where the builds either side produced 637** — eight records and fifteen kilobytes of text gone, with **exit code 0 and no warning.** Now both tools wait for the page to stop changing, then read it twice and require the two reads to agree, and a page that never settles is a hard error rather than a quiet truncation. Removing the sleep also made the whole run faster, which is the usual reward for replacing a guess with a question.

### A tool's worst failure is the page it didn't look at

Zero failures out of zero elements measured looks exactly like a clean page. Worse: when a page silently drops out of a sweep, its failures leave the total, so **the number goes down and reads as progress.** So the contrast checker reports any page it could not measure as `UNREAD`, never as `ok`, counts those separately from the failures, and fails on them on their own terms before contrast is even considered.

The same instinct runs through the rest. Where a check genuinely cannot answer — a heading painted with a clipped gradient has no single pair of colours to compare — it says *unmeasured, check by eye* rather than guessing. **A tool reporting “I can't check this” is reporting a gap, not clearing it.** That list once ran to **196 entries** and was being read as a footnote — while **90 elements across 45 pages** printed invisibly, including the site's own wordmark, so the front page came off the printer with no title on it. The tool had been saying *look here* the whole time.

### Keep every baseline at zero

All six gates sit at a baseline of zero, and that is a maintenance decision rather than a compliment to the code. The contrast gate stood at **110 failures** on the morning of 13 August and was cleared that day. A gate that reports “110, same as yesterday” requires a human to remember yesterday's number; a gate at zero requires nothing. *A green number you have to read past stops being read.*

Two more rules earned the same way. **A check that has to be rebuilt is a check nobody runs** — the contrast tool was written three separate times as a throwaway scratch script before anyone committed it. And **a comment is a note, not a control**: one zine's source carries a warning that anything drawn past a certain coordinate lands on the words. The warning was accurate, it was correct, it was right there, and it did not stop the next page from doing it. That is the whole difference between documentation and a gate.

### The first honest run is the argument for the gate

The collision checker's first real run over the finished site found **seven pre-existing defects nobody had seen** — four covers with a caption printed over the title, an unbreakable label overflowing its column onto the body text, and a shipped page where a reader was being shown *“ight-years.”* None of these was subtle. All of them had been live for weeks, on a site with five other automated checks and a fact-check ledger, being read by people.

## What machines are good at, and what they are not

There is a name for the method these gates implement, and it is not ours. [The previous essay](https://starstuff.earth/a-promise-not-a-finding.html) takes it from Terry Pratchett: **First Sight** is seeing what is actually in front of you rather than what you expected; **Second Thoughts** are the thoughts that watch the first ones. Not doubt — supervision.

Second Thoughts can be built. First Sight cannot.

Which is the honest shape of every tool in `tools/`. Look again at the table above and notice what it is a list of: **six faults that a person found first.** Not one gate anticipated the fault that created it. The sequence is always the same, and it does not reverse.

*Figure 2 · the order the six gates were actually built in, without exception*

This is not a modest framing of automation. It is a precise one, and it is what makes the machines worth having: a gate never has to notice the same thing twice, which means the noticing can move on. Two thousand eight hundred and fifty lines of checking code is two thousand eight hundred and fifty lines of attention that nobody has to spend again.

*the division of labour, stated honestly*

| what a machine is good at | what it structurally cannot do |
| --- | --- |
| **Exhaustive.** 115 pages, 94,718 tags, 1,648 ids, 1,270 index records — every one, every run | **Notice that a beautiful pattern is doing your looking for you.** The wood-wide-web story got past us in three separate pieces because it rhymed so well with mutual aid |
| **Indifferent.** It does not care how much you love a finding, or how long the draft took | **Decide a subject cannot take the apparatus.** [Field Guide No. 10](https://starstuff.earth/turtle-field-guide.html) keeps five *turtles people made* out of the correction table, because running “sounds like / actually” over somebody's cosmology would be obscene |
| **Tireless.** A repo-wide sweep can touch 66 pages in one pass and check all of them | **Be embarrassed.** Which is what Glazebrook was, and it is the mechanism — the correction was published by the feeling, not by the arithmetic |
| **Repeatable.** The same question, asked identically, on every commit | **Decide what is worth making at all**, or who it is for, or what this project owes the people in it |

## Generative AI, said plainly

This is the first page on this site to state it, which is itself a small failure of the openness it is arguing for. **Generative AI facilitates a great deal of the work here** — drafting, the gates and their output, index and sitemap maintenance, the ledger, source legwork, and the sweeps that touch every page at once. Star Stuff is, among other things, an experiment in whether that can be done in service to accessibility, accuracy and transparency rather than at their expense.

So, in nouns, on both sides.

*what it does here, and what it is never allowed to do*

| does | does not |
| --- | --- |
| Draft, revise, and build pages against a written house style | Decide what is worth making, or what this project believes |
| Run and extend the six gates; rebuild the search index; keep the sitemap and the chain honest | Stand as a citation for anything, ever |
| Do the legwork of finding primaries — fetch the paper, grep the out-of-copyright book, pull the preprint | **Be the last check on a quotation.** A person reads the primary before it ships |
| Maintain `FACTCHECK.md` and write the public changelog entries, including the ones about its own errors | Be trusted about anything it merely *recalls* |

The rules constraining it are the ordinary house rules, applied without an exemption: **aggregators are leads, not citations**; a quotation is traced to the book, essay, paper or talk; a paraphrase is never dressed as a quote; the check is logged before the piece ships. With one addition that exists specifically because of the machine — **your own summary is an aggregator.** A model's account of a source is a secondary source about that source, and it is not exempt from the rule just because it is the thing writing the sentence.

Why the rule is shaped that way

[One collection here](https://starstuff.earth/collection-how-we-got-here.html) exists to separate science from three things that wear its clothes: pseudo-science, scientism, and **the smoothed popular retelling** — the version with every hedge filed off, because the tidy version travels further.

A language model is, structurally, **a machine for producing the third one**: the fluent, confident, average account, at scale. That is an odd thing to build a fact-checked site with, and the answer is not to trust it more carefully. It is to make everything it produces answerable to something that is not it — a primary source, a gate that measures, and a person who reads the paper. *The smoothing is exactly why the machinery had to be built.*

And the mechanism has already failed here, in a way worth publishing. This repository keeps a working-notes file that tells the AI how the site works. A sign-off sentence in *those notes* got absorbed as house voice, promoted to “our masthead,” and shipped in a zine — where it was quoted with the three words that repaired it removed, and then argued against. It had never been the masthead. It was a colophon on one zine, and it had corrected itself in the next breath. **Ryan Boren caught it**, and both the essay and the notes now say the same thing: *context is not evidence.* Working notes are a lead about the site, exactly like any other aggregator.

That is one of three attribution errors published in the last week alone. Another credited five neurodivergent love locutions to a single person on the strength of a citation chain that led, at every step, **back to our own pages** — a closed loop with no primary at the bottom of it, in which the aggregator being over-trusted was us. The third credited an organisation where it owed a person: [Betsy Selvam's](https://stimpunks.org/2023/06/18/lone-wolfing-the-joys-of-autistic-solitude/) byline was on the essay the whole time. Each is in [the changelog](https://starstuff.earth/changelog.html) with what was wrong, what is right, and who caught it. None was caught by a gate.

## A public entity

There is a reason a foundation whose subject is learning builds in the open rather than merely publishing when finished. Seymour Papert and Idit Harel gave it a name: **constructionism**, which takes constructivism's idea of learning as building knowledge structures and adds one condition.

“…this happens especially felicitously in a context where the learner is consciously engaged in constructing a public entity, whether it's a sand castle on the beach or a theory of the universe.”

Seymour Papert & Idit Harel · “Situating Constructionism,” in Constructionism, 1991

**A public entity.** Not a finished one — a public one, while it is being made. That condition is the whole of this page: the repository, the ledger, the tools, the errata and the changelog are not documentation of the learning, they *are* it. It is what [the Stimpunks Learning Space](https://stimpunks.org/space/) practices, and this site is the foundation eating its own cooking rather than recommending a recipe.

And it is why the errors are the most valuable thing in the repository. A private error log teaches one person, once. [Fifty published fact-checks](https://starstuff.earth/changelog.html) are a curriculum — in what a closed citation loop looks like, in how a hedge goes missing, in why the tidiest version of a story is the one to distrust. We would not have any of that if we had waited to be right.

A knowledge garden is how star stuff comes to know itself. It cannot do that behind a login.

Which lands where [the self-portrait](https://starstuff.earth/the-garden-and-the-stars-zine.html) already had it, and where [the essay before last](https://starstuff.earth/who-is-holding-the-candle.html) put the observer: there is no view from nowhere, only an unstated view from somewhere. The astronomers' white point makes that literal. **Every measurement carries an observer, and the honest thing to do with an observer is name them and show your working** — which is the same reason the changelog says who caught each error, and the same reason this page says how it was made.

Not:

- **Not a claim that open equals accountable.** Publishing a correction does not un-publish the error. People read the misattributed quote, printed the blank page, followed the citation loop. Sunlight disinfects; it does not undo.
- **Not a claim that the gates make the site correct.** Six gates at zero, 122 verified items, and we shipped three attribution errors last week. The gates measure colour, structure, position, paper, coverage and completeness. **None of them can read.**
- **Not an argument that transparency substitutes for structure.** Brandeis was arguing for publicity *alongside* regulation, not instead of it, and the sentence is regularly quoted by people who want the first without the second.
- **Not an advertisement for AI.** The honest summary is that a language model is a smoothing machine pointed at a project built to resist smoothing, and it earns its place here only under constraints that a human maintains and enforces. Take the constraints away and you get a fluent, confident, well-formatted version of exactly what this site exists to argue against.
- **Not a claim that the machines caught the interesting things.** Every gate here is downstream of a person noticing. The gate's value is that the noticing never has to happen twice — not that it happened at all.
- **Not open-washing.** Open is a licence, a repository, a runnable toolchain and a published error log, or it is a word in a footer. If any of the four goes away, so does the claim.
- **Not everything.** Your search query is yours and never leaves your browser, and there is no personal data in this repository. Open about the work is not the same as open about the people, and the second one is somebody else's business model.

## The shorter version

The average colour of the light in this universe is a warm off-white, and the first published value for it was wrong. It got fixed because two astronomers put their own erratum where their mistake had been, and because colour scientists who had nothing to do with the paper could see enough of the working to spot the flaw in it.

That is the arrangement we are copying. The pages, the tools, the reasoning, the ledger and the errors are all in one public place, at the same commit, under a licence that lets you take them. The machines here are second thoughts made durable — they hold ground that a person already took, so the person can go and look at something new. And the looking is still ours, because it has to be.

Sunlight is said to be the best of disinfectants. We work by the light of a colour that had to be corrected — in public, by the people who got it wrong, with everything shown.

[Everything we got wrong →](https://starstuff.earth/changelog.html)

**The colour.** **I. K. Baldry, K. Glazebrook** et al. (the 2dFGRS team), “The 2dF Galaxy Redshift Survey: constraints on cosmic star-formation history from the cosmic spectrum,” *Astrophysical Journal* **569**:582 (2002). The “pale turquoise” footnote is quoted verbatim from footnote 3 of the preprint, [arXiv:astro-ph/0110676](https://arxiv.org/abs/astro-ph/0110676), which still carries the uncorrected value — the correction was announced publicly before the journal version appeared. Glazebrook's two quotations, the white-point explanation and the Munsell Color Science Laboratory's role are from the **Johns Hopkins University announcement of 13 March 2002**, “Color of the Universe Corrected by Astronomers”; this is an institutional release rather than a paper, and is cited as such. **“A conditionally perceived shade of beige,”** the 200,000-galaxy figure, the ten-billion-year drift and the naming contest are from [NASA's Astronomy Picture of the Day, 2 July 2002](https://apod.nasa.gov/apod/ap020702.html). The naming of “cosmic latte” by a *Washington Post* reader is widely reported but has not been confirmed at a primary source here, so the person is described and not named.

**The rest.** **Louis D. Brandeis**, “What Publicity Can Do,” *Harper's Weekly*, 20 December 1913, collected as chapter V of *Other People's Money and How the Bankers Use It* (1914) — quoted from the full text of the book, including the second clause and the “is said to be.” **Seymour Papert & Idit Harel**, “Situating Constructionism,” the introduction to *Constructionism* (Ablex, 1991), quoted verbatim from the essay. **Terry Pratchett**, *Wintersmith* (2006), for First Sight and Second Thoughts — the argument is worked in [A Promise, Not a Finding](https://starstuff.earth/a-promise-not-a-finding.html) and credited there. [The Stimpunks Learning Space](https://stimpunks.org/space/) for constructionism and experiential learning in practice.

**The numbers.** Every figure about this repository — 115 pages, 94,718 tags, 1,648 ids, 1,270 search records across 114 pages, 114 ledger rows, 21 dated changelog releases and 169 entries of which 50 are fact-checks, roughly 2,850 lines across the six gates — was measured from the repository on **17 August 2026**, at the commit that added this page, by running the tools named above. They will drift, and this page is not the place they are kept current — the commands that produce them are in the repository, which is the point.

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/)
 stimpunks.org · morerealms.com · starstuff.earth
 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · open edition · print freely
