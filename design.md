---
title: "Design System"
url: "https://starstuff.earth/design.html"
updated: "2026-09-13"
description: "The Star Stuff design system: Atkinson Hyperlegible, a five-accent palette on a violet-cast near-black, full-opacity body text at 18.84:1, and a starfield in pure CSS. Built accessibility-first, printable, and credited — including what it borrowed from Solarized and what it deliberately threw out."
collection: "Notes & Rationale"
licence: "CC-BY-SA-4.0"
licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"
fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"
generated_by: "tools/build-markdown.mjs, from the page's own <main> landmark"
---

[Stimpunks](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Star Stuff Design System

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · How It's Built

# The *Design System*

One typeface chosen for legibility, five accents held at near-uniform lightness, and body text that never fades. The visual language of this collection is itself an argument about access — so here it is, with its numbers and its receipts.

---

Every artifact here is a **single self-contained HTML file** with **no third-party dependency** — no build step, no framework, no JavaScript required to read a word, and nothing fetched from anybody else’s server before a page draws. That last clause is newer than the rest: until 9 September 2026 this said *no dependencies beyond Google web fonts*, and the fonts were the dependency — every reader’s address went to Google before a word appeared. The four families are served from this domain now. The pages carrying video embeds remain an exception, and [the privacy page](https://starstuff.earth/privacy.html) states it rather than rounding it down. That constraint is the first design decision, and most of the others follow from it. A zine should be one file you can save, print, fork, or hand to someone.

Accessibility isn't a layer applied at the end. It is the thing that decides the palette.

## Typeface

The collection sets its prose in [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), released free by the Braille Institute in 2019 and named for its founder, J. Robert Atkinson. It was drawn for readers with low vision, and its whole argument is *letterform distinction* — making characters that are commonly confused resolve differently from each other rather than merely look handsome together.

The disambiguation problem

I l 1 | 0 O o r n m a e s

Look at the tail on the lowercase `l`, the slashless but narrowed `0`, the distinct apertures on `a`, `e`, and `s`. In a face built for elegance these converge; here they are deliberately pulled apart. For a collection about not being sorted into a norm, a typeface designed by and for people the standard face failed is not a neutral choice.

Display · Atkinson Hyperlegible Next Bold

The universe doesn't pathologize its own variation.

Body · Atkinson Hyperlegible, 1.02rem / 1.75

Almost every atom heavier than helium was forged in stars and their deaths. The calcium in your bones and the iron in your blood came from stars that died before the Earth existed.

Labels & counters · Space Mono

STIMPUNKS FOUNDATION · ZINE NO. 1 · SPREAD 3 / 7

Two other faces earn their place. **Space Mono** carries every eyebrow, label, page counter, and colophon — a monospace voice for the machinery around the text, deliberately unlike the prose so it never competes with it. **Fraunces** appears where a piece needs an editorial register rather than a documentary one; *Bone Song*, *Underground*, and *You Were Never One Thing* are set in it with Space Mono, and use no Atkinson at all.

**All four families are self-hosted**, twenty woff2 files in `fonts/`, declared once in `starstuff.css` — the exact set Google was serving, with the same subsets and the same `unicode-range` values, because hand-picking subsets is how a self-hosting pass loses a glyph nobody meets until a reader does. All four are OFL 1.1 and unmodified, each licence shipped beside the files. No page carries a font `<link>` or a preconnect; adding one back would restore the third-party request the privacy page says is gone.

The migration, and the bug it uncovered — both from when the fonts still came from Google

The collection ran on two versions of the face for a while: 18 pages on **Atkinson Hyperlegible Next** (the 2025 release, which adds five weights, a variable format, and support for over 150 languages), 26 still on the original, and 3 — the Fraunces-set trio above — on neither. All 44 Atkinson pages now load Next. Switching cost nothing in layout: the same measuring string set at 16px came out 286.97px before and 286.78px after, and across 126 measured text blocks not one changed height, width, or line count.

The sweep turned up something worse than a split. Every page requesting Next asked Google Fonts for a `200..900` weight range — but Next only publishes **200–800**, so the request returned **HTTP 400** and no `@font-face` rule at all. Those pages had been quietly falling back to `system-ui` for every visitor who didn't happen to have the font installed locally, which is to say almost all of them. A typeface picked specifically because it was drawn for readers the standard face fails was not reaching those readers. Corrected to `200..800`; the woff2 now actually downloads.

## Palette

The canonical tokens live in `starstuff.css` as `:root { --sp-* }` — one source of truth for every recurring color. Each page aliases them inline (`--purple: var(--sp-purple)`), so a palette change happens in one place instead of forty-seven. A new shared color means a new `--sp-` token, never a hex pasted across pages.

### Grounds

--sp-void-deep

#07070f

L\* 2.1

--sp-void

#0a0a14

L\* 3.0

--sp-deep

#0d0d1a

L\* 4.0

--sp-page

#0f0f1c

L\* 4.8

--sp-card

#0f0f2a

L\* 5.5

None of them is black. Each carries a violet cast — `#0a0a14` sits at hue 290° in CIELAB — so the ground reads as night rather than as absence. `--sp-card` is the most saturated of the five, which is what makes a card lift off the page without a border or a shadow doing the work.

### Accents

--sp-purple

#a78bfa

L\* 64.6 · 7.24:1

--sp-pink

#f472b6

L\* 65.5 · 7.44:1

--sp-gold

#fbbf24

L\* 80.7 · 11.80:1

--sp-cyan

#22d3ee

L\* 77.9 · 10.90:1

--sp-green

#4ade80

L\* 79.2 · 11.30:1

Five accents, all of them clustered between **L\* 64.6 and 80.7** — a spread of 16 points across the whole set. That tight band is the discipline: any accent can replace any other on a given page without changing how heavy the page feels. It's why each zine can be tinted differently (cyan for water, green for aurora, gold for bone) and still be recognizably the same collection. The lowest-contrast accent on the darkest ground still clears **7.2:1**.

### Text & neutrals

--sp-white

#f9fafb

L\* 98.2 · 18.84:1

--sp-white-soft

#f4f2fb

L\* 95.9 · 17.76:1

--sp-secondary-soft

#d4d0e4

L\* 84.3 · 13.07:1

--sp-muted

#c4b5d4

L\* 75.8 · 10.23:1

--sp-secondary

#b8aed0

L\* 72.9 · 9.38:1

--sp-dim

#8a86a0

L\* 57.1 · 5.62:1

--sp-dim-soft

#807d98

L\* 53.5 · 4.97:1

Note what the ladder does *not* do: it never dips below full opacity to make text quieter. "Muted" here means a different hue at high contrast, not the same hue at 60% alpha. Every value above clears WCAG AA for body text against `--sp-void` — the dimmest by the smallest margin, and only after being lifted for exactly that reason.

The one that failed, and what it cost to fix

`--sp-dim-soft` used to be `#63607a` — **3.27:1**, under the 4.5:1 AA floor. It styles page counters, series numbers, colophons and refs at 0.5–0.55rem, so it is small text and gets no large-text exemption; publishing a contrast table with that in it was the thing that made it obvious. Raised to `#807d98`: same CIELAB hue and chroma, L\* 41.9 → 53.5, now **4.97:1** on the void and 4.73:1 on the lightest ground, still visibly softer than `--sp-dim`.

Auditing every text element against its *own* composited background then turned up four more: an accent pink on a tinted card that came to 4.43:1, three runs of alpha-faded cream on the broadside — the exact "faded gray" this system claims to refuse — and two links left unstyled, falling back to the browser's default blue at 2.11:1 on near-black. All fixed. **All 47 pages now pass AA on screen.**

## Palette lineage

The palette began as a [Solarized](https://ethanschoonover.com/solarized/) dark variant. That happened before this repository existed, so there's no commit to point at — and it matters less than it sounds, because **none of Solarized's sixteen values survive anywhere in the collection.** The accents are Tailwind CSS v3's 400-weight ramp, exactly: `--sp-purple` is violet-400, `--sp-pink` is pink-400, `--sp-gold` is amber-400, `--sp-cyan` is cyan-400, `--sp-green` is green-400, `--sp-white` is gray-50. The grounds are ours; no Tailwind gray is that violet.

What we kept from Ethan Schoonover is the **method**, and it's worth naming precisely because the method is the valuable part:

- A small, fixed, *named* accent set used as semantic tokens rather than color picked per occasion. `--sp-*` is that idea.
- Accents pinned to a narrow lightness band, so substitution doesn't disturb the page. Ours sit at L\* 64.6–80.7; Solarized's at L\* 49.1–60.1.
- A ground that refuses pure black and commits to a hue. Solarized's `#002b36` leans cyan at hue 230°; our `#0a0a14` leans violet at 290°.
- Warm cream instead of white for paper — `--paper: #f5f0e8` in the broadside, `--bone: #e8dfc8` in *Bone Song*, both close cousins of Solarized's base3 `#fdf6e3`.

And then we threw out its central move. Solarized's stated goal is to *reduce* brightness contrast while keeping hue separation. We push contrast as high as it goes:

*Body text against its own ground*

| Scheme | Text | Ground | Contrast |
| --- | --- | --- | --- |
| **Star Stuff** | #f9fafb | #0a0a14 | 18.84:1 |
| Solarized dark | #839496 | #002b36 | 4.75:1 |
| Solarized dark (emphasis) | #93a1a1 | #073642 | 4.86:1 |

"Full-opacity body text, no faded grays" is a direct repudiation of the scheme this palette started from. A low-contrast colorscheme is a lovely thing in a code editor at 2am and the wrong thing entirely for a document meant to be readable by people with low vision, printed on a cheap printer, and handed across a table. Accessibility-first won the argument. **Credit Solarized for the discipline, not for the colors.**

## Principles

Full opacity

Text is never dimmed with alpha to signal hierarchy. Hierarchy comes from size, weight, and hue at full strength.

Generous leading

Body copy runs 1.75 line-height. Long measure is capped around 36–38rem so lines stay trackable.

8px radius

Cards round at 8px — soft enough to read as an object, tight enough to stay documentary.

3px left border

A colored left rule marks anything set apart: claims, callouts, specimens, cards. The system's most reused gesture.

Pure-CSS starfield

Stars are layered `radial-gradient` stops on `body::before`, plus a few absolutely-positioned twinkling dots. No images, no canvas.

Spectrum rule

A 2px gradient through all five accents, used once per page as a signature — the palette introducing itself.

### Motion, and the option to refuse it

The starfield twinkles from one shared `@keyframes twinkle-anim` in `starstuff.css` — it used to be copy-pasted into some twenty-five pages. Anyone whose system asks for less motion gets none: a global `prefers-reduced-motion` block collapses every animation and transition to 0.001ms and disables smooth scrolling, across every page at once. Motion here is decoration, and decoration must be declinable.

### The refusals

Not:

- Not low-contrast because low-contrast looks sophisticated.
- Not gray text on gray backgrounds to signal "secondary."
- Not a framework, a build step, or a bundle to read one page of prose.
- Not a design system that can't survive being printed in black and white.
- Not accessibility as a compliance checkbox added after the visual design was settled.

## Print

These are meant to be printed and handed to people, so paper is a first-class target rather than an afterthought. `starstuff.css` strips the site navigation and paging chrome from every printed page — that chrome is never content.

On paper the whole collection inverts: white sheet, near-black type, decoration dropped. Because every page aliases the `--sp-*` tokens, the shared stylesheet inverts them once inside `@media print` and all forty-seven pages follow. Accents become ink there too — gold `#fbbf24` on white is 1.6:1, so an accent that carries meaning as text has to give up its color to stay readable. The one exception is the spectrum rule, a 2px sliver kept in full color with `print-color-adjust: exact`, which survives the browser's background-graphics setting. Diagrams inherit the same treatment: SVG paints with `fill` and `stroke` rather than `color`, so labels and line art are inverted separately — the diagrams are content here, not ornament.

Paged zines also turn inside out for paper. On screen a zine shows one `.spread` at a time; a single Cmd/Ctrl+P reveals every spread and starts each on its own sheet, so you get the whole zine rather than the visible page.

This was broken until it wasn't

Worth recording plainly, because the failure is more instructive than the fix. Browsers leave "Background graphics" off by default. For most of this collection's life, no page inverted its colors for print — so a light-on-dark zine sent near-white type to a white sheet and **printed blank**. Measured with print media emulated, **44 of 46 pages printed illegibly**. On one, no pixel anywhere on the sheet was darker than mid-gray. The *Bone Song* poem — a piece built to be printed and handed to someone — came out as an empty page.

Only the [changelog](https://starstuff.earth/changelog.html) was correct. The [L★S broadside](https://starstuff.earth/ls-broadside.html) was half-right: its recto prints as designed, but its verso carried the poem in cream on near-black and vanished too. All forty-seven pages now print legibly, verified two ways — computed text contrast against white for every text element, and pixel sampling of the rendered sheet. **A stated principle nobody measures is a wish.**

## Shared assets

*What every page pulls in*

| File | Carries |
| --- | --- |
| **starstuff.css** | The `--sp-*` palette tokens, the `.ss-nav` site navigation, the shared twinkle keyframe, the reduced-motion block, the print rules, and the injected spread-footer nav styles. |
| **starstuff.js** | Per-spread prev/next controls and `#spread-N` deep linking for paged zines. A safe no-op on any page that isn't one. |
| **favicon.svg** | The L★S mark. |
| **og-card.jpg** | The 1200×630 link-unfurl card shared by every page. |

Everything is linked by relative URL, which is what lets any page be saved, moved, or served from a subdirectory without breaking. Each page tints the shared nav by setting one custom property — `--nav-accent` — on the nav element, which is the whole theming API.

## Changing the words, without editing HTML

There is no content management system here and there is not going to be one. The three that would otherwise fit — Decap, Sveltia, TinaCMS — are all editors over a *content model*: collections of files with named fields. This site has none. A zine is one self-contained file carrying its own starfield, its own cover composition measured at two viewports, its own palette aliases, and, if it is a field guide, its entries as JavaScript objects. There are no fields to put in a schema — which is the same reason every collection here is a page that argues rather than a folder that sorts.

What a contributor actually needs is much smaller: change some words without editing raw HTML. That is `edit.js`, and **nothing on this site loads it.** A normal visit fetches it never. It arrives from a bookmark you make yourself, which is why it costs a reader nothing on a site that self-hosts twenty font files to avoid a single third-party request.

[★ Edit this page](javascript:(function()%7Bvar%20s=document.createElement('script');s.src=location.origin+'/edit.js';document.body.appendChild(s);%7D)();) **Drag this to your bookmarks bar.** Do not press it — on this site it will not run, and that is the security policy working rather than failing. Our `script-src` carries a hash for every inline script on the site, and CSP Level 3 makes a browser discard `'unsafe-inline'` the moment a hash is present. A `javascript:` URL needs precisely that keyword, so pressing this logs a refusal and does nothing. Dragging it is not running it, so dragging still works.

Then open any page here and press the bookmark. **Safari runs it**, tested by hand on 13 September 2026 — and Safari was the one worth checking, because a bookmarklet’s exemption from the page’s content policy is each browser’s own decision rather than something the policy grants, and Safari is where that decision has differed before. If some other browser ever declines, paste this one line into its console instead. It needs no exemption from anything, because loading a script from this same origin is something the policy allows outright:

`(function(){var s=document.createElement('script');s.src=location.origin+'/edit.js';document.body.appendChild(s);})()`

Change what you like, press **Copy my edits**, and paste the result to Ryan or Helen, or into a Claude session. **It cannot save, and that is the design rather than a shortfall** — saving from a browser needs a token sitting in the page, which is the account problem the CMS question was trying to avoid. What you get instead is a patch: the exact text before and after, block by block, which either matches the file or fails loudly.

**It writes nothing to your device, and that is a deliberate difference from our sister site.** Queering Earth's editor keeps a key in local storage so a half-finished edit survives a reload. This one does not, because [our privacy page](https://starstuff.earth/privacy.html#nothing-on-your-device) makes an absolute claim and then invites you to check it — and one storage call in this file would make that page false by the exact test it proposes. So edits live in memory and your browser warns you before you lose them. A policy you can check is worth more than a convenience.

What it refuses to edit, and why that is the point of it

**Quotations, and every attribution attached to one.** Pull-quotes, citations, source lines, the line beneath a quotation that names who said it. The failure this site is organised against is not an invented source — it is a *tightened* one, a sentence trimmed to fit with the attribution left attached. A tool that let anybody reword a mounted quotation in two clicks would be a machine for producing exactly that. Every quotation here is traced to a primary and logged in `FACTCHECK.md`; a wording changed in a browser has no such trace behind it.

**Colophons.** They hold the sources and the credits, which is why the search index keeps them and strips almost everything else that repeats on every page.

**Every epistemic grade.** *Documented*, *contested* and *leap* on a chain; *verified* and *contested* on the Wire; the five readiness tiers on a Trigger. A convenience tool that promotes a contested joint to a documented one in a single keystroke is a laundering machine, and that notation is the whole reason the chains are worth reading.

**Cards.** A card's words are read by `build-derived.mjs` to write [What's New](https://starstuff.earth/whats-new.html), the feed and `llms.txt`, and indexed by the search builder. Editing one goes stale in two generators at once — more than a per-block patch can honestly carry.

**Field-guide entries.** Those guides build their entries from JavaScript objects, so the words live inside a quoted string rather than in any block of HTML. A patch could not say where they are, and one apostrophe in the wrong place would close the quote and take the whole guide down.

**Covers, tables and the masthead.** A cover is a measured composition, and changing the words moves the title wrap underneath the ornaments. A table here is a ledger — a contrast floor, a palette, a set of readiness grades — and a ledger you can edit in a browser is not a ledger, so no cell of one is editable at all. The Stimpunks × More Realms pairing reads the same on every page, so it is not changed on one.

Each of these says why where you try it, and every refused block carries a dotted outline so you can see what is off-limits before you press it. **It also flags any edit that touches a figure**, because every count in our prose is a lead rather than a fact, and no check we run can read one.

Measured rather than assumed, the way everything else on this page is. `tools/check-edit-ui.mjs` injects the editor under the real security policy on ten pages, one for each shape this site takes, then checks the contrast of every surface it draws against the lightest ground here, that no control is under 44×44 or overlapping another, that the refusals actually fire, and that a page which armed nothing says so rather than passing quietly. It found two faults in the first draft that no amount of reading would have: every readiness grade on a Trigger was editable, because the refusal looked upward for a container and this site puts its grades *inside* paragraphs — and on the card pages a refused block never explained itself at all, because a card is a link and pressing one navigated away.

Reuse it

This system is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), like everything else here. Take the tokens, take the contrast floor, take the refusals. If you build something with it, the only ask is that you keep it free and pass it on. **Solidarity, not charity.**

Every correction to this page, and to every piece in the collection, gets published in the [changelog](https://starstuff.earth/changelog.html) — our own errors included.

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · [starstuff.earth](https://starstuff.earth) · [About](https://starstuff.earth/about.html) · [Changelog](https://starstuff.earth/changelog.html) · [stimpunks.org](https://stimpunks.org) · [morerealms.com](https://morerealms.com)
 Print freely · Share freely · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · L★S · You were ★stuff all along
