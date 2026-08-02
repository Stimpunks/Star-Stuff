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
1. **Find every occurrence.** `grep -rni` the concept/phrase across the repo — not just the one
   spread Ryan pointed at. Coinages recur across zines and the ledger.
2. **Verify the real originator.** `WebSearch` + `WebFetch` before crediting. Check whether the
   named person actually coined it, or was themselves crediting someone earlier. When auditing a
   person (e.g. Helen Edgar), read their own writing (morerealms.com, autisticrealms.com) to see
   whom *they* credit.
3. **Add the attribution** in house style at each occurrence — inline credit, plus a full
   citation where the source warrants it.
4. **Log it in `FACTCHECK.md`** — the per-zine ledger of claims → sources → credits.
5. **Ship** — commit and push (see the `ship-zine` skill).

## Principle
When unsure about a coinage, verify rather than let a plausible attribution stand. Over-crediting
others and under-claiming for Helen/Ryan is the safe direction. Fix the attribution *everywhere*
it appears, not only where it was flagged.

_Draft scaffolded from session history — refine against the repo's actual conventions._
