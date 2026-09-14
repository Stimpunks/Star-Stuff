---
name: decision-review
description: Surface open vs settled decisions in a repo and maintain a DECISIONS.md ledger. Use when Ryan or Helen asks "are there any outstanding decisions to make?", "any decisions in the log?", "start a decisions log", or "seed it". Answers durably in DECISIONS.md, not just in chat.
---

# decision-review

Ryan and Helen both open sessions by checking what still needs deciding, and both want those
answers to persist rather than live in one chat.

**Record who settled a decision.** With two contributors the ledger is also the record of who
decided what; an entry reading only "settled" is half an entry. Write "settled 2026-09-14, by
Helen" (or by Ryan) the way the existing entries do.

## Steps
1. **Look for an existing log first.** Check for `DECISIONS.md`, then repo `TODO`/`FIXME`, open
   questions in `README`, and any notes/changelog (`git ls-files`, `grep -rniE`).
2. **Mine git history.** `git log` for threads that were raised but not resolved.
3. **Separate open from settled.** Present two clear lists: decisions still needing a call from Ryan or Helen
   vs ones already made (with the rationale, so they're not re-litigated).
4. **Persist it.** Offer to create or update `DECISIONS.md` — seed it from the repo + git history,
   marking each item Open or Settled. Both want this seeded, not just discussed.
5. If a decision gets made in the conversation, record it (with its reasoning) in `DECISIONS.md`
   and ship (commit + push).

## Notes
- Prefer a durable artifact over a chat-only answer.
- Watch for small copy/consistency decisions too — they get noticed and fixed.

_Draft scaffolded from session history — refine against the repo's actual conventions._
