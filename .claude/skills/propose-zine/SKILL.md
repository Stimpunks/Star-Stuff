---
name: propose-zine
description: Propose a new Star-Stuff zine from a source link, PDF, or concept. Use when Ryan says "propose a star stuff zine based on…", "draft a zine about…", or hands over an essay/URL to turn into a zine. Grounds the concept in real sources plus the house voice and the ARLES framework, then offers a title and a spread-by-spread outline BEFORE building.
---

# propose-zine

Ryan wants a grounded proposal and a choice of direction first — not an immediately-built zine.

## Steps
1. **Ground it.** Read the source thoroughly (`WebFetch` the URL/essay; read a handed-over PDF).
   Pull the core thesis and the concepts/coinages worth carrying into a zine.
   **Then go past the source to its primary literature.** The essay handed over is usually a
   secondary account, and the papers behind it routinely contain the thing that makes the zine
   ours. No. 31's whole argument came from reading the crab paper the essay cited: the body plan
   was *lost* more often than gained, and the reasons "remain a mystery" — neither fact in the
   essay, and both cutting against the reading its title invited.
2. **Search the library before proposing** (see the `sks-search` skill):
   ```bash
   tools/sks-search.sh query "the zine's core idea"                    # prior art, ours
   tools/sks-search.sh search "key term" -c highlights -n 10           # sources already on disk
   tools/sks-search.sh search "key term" -c site -n 12                 # incl. Helen's sites
   ```
   Three things this catches: an argument Stimpunks has already made better elsewhere (propose
   the *companion*, not the duplicate); primary sources sitting in Ryan's Readwise that would
   otherwise be hunted from scratch; and **whether Helen has written on it**, which decides the
   guest-vs-house question and the credit line before a title is even offered. Finding only —
   nothing returned here is a citation.
3. **Learn the house style.** Sample a couple of existing `*-zine.html` files for structure
   (spreads, eyebrow/title, nav, colophon) and voice (neurodivergence-affirming, relational /
   solarpunk, poetic but precise).
4. **Crosswalk if useful.** Where the source is an academic framework, map it rung-by-rung to
   **ARLES** (the crosswalk method Ryan uses to incorporate external frameworks).
5. **Propose, don't build.** Present via `AskUserQuestion`:
   - 2–3 **title** options,
   - a **spread-by-spread outline** (what each spread says / shows),
   - whether it's a **guest zine** or house zine, and who to **credit** (verify sources up front —
     see the `credit-source` skill).
   Say plainly which claims are verified and which are still open, so the direction is chosen on
   solid ground rather than on a promising-sounding one.
6. **Build only after Ryan picks a direction**, then hand off to `ship-zine`.

## Rules
- Credit every concept to its originator from the start; don't attribute coinages unverified.
- Match the existing zines' spread rhythm and voice rather than inventing a new format.

_Draft scaffolded from session history — refine against the repo's actual conventions._
