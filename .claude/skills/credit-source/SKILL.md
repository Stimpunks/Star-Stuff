---
name: credit-source
description: Attribute a concept, phrase, or coinage to its true originator across the repo. Use when Ryan says "credit X for Y", "add an attribution", "who coined this", "audit attributions", or wants to make sure someone's work isn't misattributed. Finds every occurrence, verifies the real source on the web, adds a house-style citation, and logs it in FACTCHECK.md.
---

# credit-source

Attribution is treated as a correctness requirement in Star-Stuff, not a nicety. Recurring
examples: "Spiral Time" → Marta Rose; "weather-bodies" → Ombre Tarragnat; a paraphrase → Eliot;
"intradependence" → Karen Barad (not Helen Edgar); auditing the repo so others' work isn't
attributed to Helen.

## Steps
0. **Search the library first** (see the `sks-search` skill). Two questions, one command each:
   ```bash
   tools/sks-search.sh search "the phrase" -c highlights -n 10   # is the primary already on disk?
   tools/sks-search.sh search "the phrase" -c site,notes -n 12    # what have we already published?
   ```
   The first can save an afternoon — Ryan's Readwise export holds ~1,460 sources, and the book
   you are about to hunt on the web may be sitting there. The second tells you **which wording
   we have been repeating**, which is the thing you are actually auditing. It is a finding step:
   nothing it returns is a citation, and our own prior wording least of all.
1. **Find every occurrence in this repo.** `grep -rni` the concept/phrase across Star Stuff —
   not just the one spread Ryan pointed at. Coinages recur across zines and the ledger.
2. **Verify the real originator against the primary.** `WebSearch` + `WebFetch`, and go to the
   book/paper/essay itself. Check whether the named person actually coined it, or was themselves
   crediting someone earlier. When auditing a person (e.g. Helen Edgar), read their own writing
   (morerealms.com, autisticrealms.com) to see whom *they* credit.
   **A secondary source that says it is quoting is still a secondary source.** Kevin Kelly
   introduced Eno's *scenius* definition with "His actual definition is:" and then altered three
   words; that rendering is now the one in general circulation, including on stimpunks.org.
3. **Add the attribution** in house style at each occurrence — inline credit, plus a full
   citation where the source warrants it. Where a circulating version differs from the primary,
   say so on the page rather than silently preferring the right one.
4. **Audit the propagation.** An error is rarely in one place. Once you know the correct form,
   sweep for **every variant** — in this repo and across SKS:
   ```bash
   grep -ril "distinctive fragment" --include="*.md" --include="*.html" .
   tools/sks-search.sh search '"distinctive fragment"' -n 20
   ```
   Search fragments, not whole sentences: drift produces hybrids that an exact-phrase search
   misses. The *scenius* sweep found **three** variants across five files, and the correct
   wording in none of them. Fix what lives in Star Stuff; for anything in SKS or on
   stimpunks.org, record the paths as **`Open`** in `FACTCHECK.md` and leave the fix to a
   session in that repo — never edit SKS from here.
5. **Log it in `FACTCHECK.md`** — the per-zine ledger of claims → sources → credits, plus the
   out-of-repo instances from step 4.
6. **Ship** — commit and push (see the `ship-zine` skill). Corrections to our own published
   claims also earn a `changelog.html` entry; name the error plainly.

## Principle
When unsure about a coinage, verify rather than let a plausible attribution stand. Over-crediting
others and under-claiming for Helen/Ryan is the safe direction. Fix the attribution *everywhere*
it appears, not only where it was flagged.

**Our own library is where a misquotation hides best.** Five internal copies of a wrong quote
feel like five confirmations, and searching the garden will keep returning them. Use SKS to find
how far something has spread; go to the primary to find out whether it is right.

_Draft scaffolded from session history — refine against the repo's actual conventions._
