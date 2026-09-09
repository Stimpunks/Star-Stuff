---
title: "Designing for Paper"
url: "https://starstuff.earth/print-design.html"
updated: "2026-08-11"
description: "How the broadsides are built, and why every number is what it is: 190 × 259 mm as the intersection of A4 and US Letter, 9 mm margins rather than 10, ink on white in both media because browsers omit background graphics, borders instead of backgrounds, two spot inks darkened until they clear AA on white, and the three tools that measure it. Plus what the tools cannot see."
collection: "Notes & Rationale"
licence: "CC-BY-SA-4.0"
licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"
fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"
generated_by: "tools/build-markdown.mjs, from the page's own <main> landmark"
---

[Stimpunks](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Notes · Print Design

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Rationale

# Designing for *Paper*

Notes & Rationale · how the broadsides are built

Every number here was arrived at by printing something and finding out it was wrong. This page is the working — the spec, the inks, the gates, and the faults that no gate can see.

---

Backing material for the [Print collection](https://starstuff.earth/collection-print.html), which argues *what* earns a sheet. This one covers *how* a sheet is made, and is deliberately outside the reading chain — it is reference, not a stop on the tour. For the site-wide visual language, see [The Design System](https://starstuff.earth/design.html); this page is only about the artifacts made for paper.

## The format

One fixed specification for every sheet. The point of a fixed format is that eight different arguments come off the printer as the same object — a rack, not a pile — and that a reader in any country gets the same artifact from the same file.

*Four decisions in the sheet specification, and what each one buys*

| 190 × 259 mm | The intersection of A4 and US Letter. At 9 mm page margins, A4 gives a box of 192 × 279 mm and Letter gives 198 × 261 — so a sheet inside **both** is one file that prints uncropped in either country, with no “US version” to maintain and get out of sync. |
| --- | --- |
| 9 mm margins, not 10 | At 10 mm the Letter box is 259.4 mm against a 259 mm sheet. That 0.4 mm of slack was thin enough for sub-pixel rounding to tip the whole thing onto **a third page**. Found by printing to PDF and counting, not by reading the arithmetic — the arithmetic said it fit. |
| Two sides, A and B | Side A is the face; side B does the work. Enforced structurally: each side is a `.sheet` element with `page-break-after` on the first, so the file is two printed sides or it is broken. |
| Breakpoint below 700 px | The one that looks like a screen concern and isn't. **Print media queries resolve against the page box, not the screen** — and the narrowest real page box here is A4 less its margins, 192 mm, or about 726 px. A mobile breakpoint set at 820 px was therefore matching *on paper*, collapsing a two-column card into one 190 mm column at roughly 95 characters a line, long enough that side B overran and was silently clipped. |

## Ink on white, in both media

The rest of the site is light on dark, and `starstuff.css` inverts it inside `@media print` so a zine survives being printed. The broadsides never enter that machinery: they are drawn as ink on white on screen *and* on paper, so what you see in a browser is a preview of the sheet rather than a different design that will be converted later.

The reason is blunt. **Browsers leave *Background graphics* off by default**, so a light-on-dark page reaches paper blank — which is exactly what happened to 44 of the 46 pages on this site until somebody measured it. A broadside cannot depend on a reader finding a checkbox in a print dialog, because the whole premise is that it gets handed to people and photocopied by people who never saw the web page at all.

### Borders, not backgrounds

Same constraint, one level down. The registration bar across the top of each sheet is a `border-top`, not a background — because borders survive that checkbox and background colours do not. An earlier design put the cream stock in a `background-color` and a halftone in a `background-image`, and neither ever reached paper. What *did* print was the gold misregistration shadow, because it happened to be text: at 1.84:1 on white, a faint smudge. The reader got the flaw of the effect and none of its charm.

## Type

**Atkinson Hyperlegible Next throughout**, with Space Mono for labels and chrome. Atkinson was drawn by the Braille Institute for letterform distinction at exactly the small sizes a hand-out uses — the 6–9 pt range where a broadside does most of its work.

**No display serif.** Fraunces was inherited from the earlier risograph costume and went with it. It is *Bone Song*'s editorial voice, not a broadside's, and more to the point it is a high-contrast serif whose hairlines are the first thing to drop out of a photocopy or a tired laser printer — which is most of a broadside's life. Worth recording that before this was fixed, the sheets *loaded* Atkinson and rendered 0% of their characters in it.

**The star is drawn, not typed.** Atkinson has no `U+2605`, so a typed ★ silently comes from whatever font the reader's system happens to supply — measurably so: the character rendered at exactly the generic-serif advance width. For a logotype on a sheet meant to print identically everywhere, that is not good enough, so the L★S mark is an SVG path with an inner radius 0.382 of the outer, filled `currentColor` so it inherits the surrounding ink.

## Two spot inks

An explicit exception to a house rule. `starstuff.css` flattens all five accents to near-black inside `@media print` *on purpose* — print is monochrome by default here. The broadsides keep two colours each, declared as literal hex rather than aliased to the `--sp-*` tokens, and forced through with `print-color-adjust: exact`.

They have to be declared literally because **the screen accents measure 1.6–2.7:1 on white** and are unusable as paper ink. So each is the house hue darkened until it clears WCAG AA on white, and each sheet takes a different pair — which means the bar across the top tells you which sheet you are holding when five of them are face-down in a stack. That is the registration bar's real job.

**Gold · #92400e**7.1:1 · L★S & Elements faces

**Violet · #5b21b6**9.0:1 · Six Ways & BGUTI faces

**Pink · #9d174d**7.9:1 · Refuse face, Elements verso

**Green · #166534**7.1:1 · Owed face, Shared Air verso

**Cyan · #164e63**9.1:1 · Water & Air faces, BGUTI verso

## What we check, and how

For about a year, both of the original broadsides said “two-sided single sheet” in their own copy, and both were lying. Measured by printing to PDF and counting pages: **the L★S sheet came out as three sides on US Letter and two on A4** — a different physical object depending on the reader's country — and *Six Ways* came out as four sides on both. Nothing in the repository could see it, because the checks that existed measured whether ink was legible, not whether it landed on the page.

Three committed tools now run before a sheet ships. Each exists because something shipped broken in a way the others could not detect.

tools/check-sheets.mjs

Prints each sheet at both paper sizes and counts pages, *and* separately measures content height against the box. The separate measurement is the subtle part: a fixed-height sheet whose content overruns does not paginate — it is silently **clipped** — so a clean page count can still hide a cut-off final line. It measures at the real page-box width rather than a desktop viewport, for the breakpoint reason above.

tools/check-contrast.mjs

Composites every text element against its *real* ancestor background stack, on screen and under print emulation, at WCAG AA. It runs a separate pass for SVG `text` fills, because `color` never reaches `fill` and a CSS-only pass is structurally blind to diagrams. The print pass composites against the bare white sheet rather than trusting emulated print media, which still paints backgrounds a real reader will not get.

tools/check-markup.mjs

Reads source rather than the DOM, and that is the design: it catches markup the browser silently rewrites — nested `<a>` or `<button>`, a block element inside a `<p>`, duplicate `id`s. You cannot find these in a DOM, because by the time a DOM exists the parser has already repaired the nesting and the evidence is gone.

What the tools cannot see

All three measure something real, and all three have been walked past. Kept here as a standing caveat rather than a solved problem:

**A label can be perfectly legible and still unreadable.** The figure on *The Same Water* passed the contrast check on all seven of its labels while one of them sat directly on top of the line it was labelling. Colour was fine. Position was not, and nothing measures position.

**A decorative element can lie across the artwork.** The rotated edge stamp on the L★S sheet had been printing 265 px from the right edge — straight through the giant L★S, the tagline and one of the three pillars — on the live page, for as long as that sheet existed. Every check passed it.

**A structurally broken page can measure clean.** Four nested anchors took the Print collection's card grid apart: boxes ending early, descriptions orphaned, footers floating in space. Contrast passed it because the text *was* legible; the search index passed it because the words *were* all there. `check-markup.mjs` exists because of that one, and its own limits are the same shape.

The rule this leaves us with: **run the gates, then look at the thing.** The gates catch what they were built to catch, and the next fault will be of a kind nobody has written a gate for yet.

## Take it and reuse it

The whole specification is four numbers and two rules: **190 × 259 mm at 9 mm margins**, ink on white in both media, borders rather than backgrounds for anything that must survive to paper, and two inks darkened until they clear AA on white. Everything else is editorial.

The sheets are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), the tools are in `tools/`, and the whole repository is public. If you make broadsides for your own community with this, that is the intended outcome, not a tolerated one — and you will not need our colours, only the method.

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Print Design · L★S
 Backing material · deliberately outside the reading chain · see also [the Print collection](https://starstuff.earth/collection-print.html) and [the Design System](https://starstuff.earth/design.html)
 stimpunks.org · morerealms.com · starstuff.earth · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
