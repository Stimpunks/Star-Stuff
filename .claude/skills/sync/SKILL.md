---
name: sync
description: Bring this checkout up to date with GitHub and make every derived file current again. Use when Ryan or Helen says "sync", "pull", "get the latest", "update my checkout", "catch me up", "what's landed", or before starting or shipping any piece. Handles the rebase, the regeneration, the conflict cases, and reports what the other person shipped — so neither of them types a git command.
---

# sync

**Two people push to `main` here, and `main` deploys.** This skill is the whole of the
git side of that, so Ryan and Helen never have to run git themselves. Run it **before
starting a piece** and **again before shipping one** — `ship-zine` step 14 assumes it.

**What it is actually for.** A `git pull --rebase` is not a merge conflict and produces no
warning, and it still leaves every generated file describing a site that no longer exists:
the search index cannot find the zine that landed while you worked, `feed.xml` does not
list it, and `_headers` carries **no CSP hash for its inline script** — which on a paged
zine is a dead pager on a live page. Pulling without regenerating is the failure mode this
skill exists to make impossible.

---

## Steps

### 1. Say where we are, before touching anything

```bash
git status -sb | head -1
git stash list
```

Report in plain words: on `main`, N commits behind / M ahead, and whether there is
uncommitted work. **Never start by assuming the tree is clean** — the common case here is
being mid-zine.

### 2. Pull, carrying any work in progress

```bash
git pull --rebase --autostash
```

`--autostash` is what makes this safe with a dirty tree: git stashes, rebases, and pops. Do
not stash by hand.

- **Nothing to pull?** Say so and skip to step 5 — the gates are still worth a few seconds,
  but there is nothing to regenerate.
- **The pop conflicted?** The work is **not lost** — it is in `git stash list`. Say that
  first, then resolve the files by reading them.
- **The rebase stopped on a conflict?** Go to step 3.

### 3. Conflicts: derived files are never resolved by hand

A derived file is a *copy*, and two copies disagreeing is settled by asking the thing they
are copies of, not by reading the diff. If any of these conflict —

`search-index.json` · `whats-new.html` · `feed.xml` · `llms.txt` ·
`.well-known/security.txt` · `_headers` · `changelog.html` · any `.md` with an `.html`
sibling

— take either side and move on; step 4 replaces the contents anyway:

```bash
git checkout --ours <file>
git add <file>
```

`search-index.json` is 6.1 MB on one line and `.gitattributes` makes git refuse to merge
it, so it will always land here. **That is the mechanism working, not a problem.**

Everything else is real content and is read, not resolved mechanically. The three that
actually collide, and how each is settled:

- **`sitemap.xml`** — two additions on adjacent lines. Keep both rows.
- **`index.html` / `collection-*.html`** — two cards at the same grid's tail. Keep both,
  but **read the result** rather than taking both hunks blind: a card can end up inside
  the previous card's `.card-wrap`, which is valid markup and renders as one shared box.
  Step 5's checks catch it.
- **`FACTCHECK.md` / `changelog-YYYY-MM.html`** — two entries at the top of the same
  section. Keep both, newest first.

Then `git rebase --continue`.

### 4. Make every derived file current

```bash
node tools/check-derived.mjs --write
```

All five generators, in dependency order, then it checks its own work. **~3 minutes**, or
add `--quick` to skip the search index (~10s) when you are only orienting and not about to
ship.

**Read the result, don't just check the exit code:**

- **No files changed** — the normal case. The other person regenerated before pushing.
- **Files changed after a clean pull** — their push was incomplete, and the live site is
  currently serving a stale index or feed. Say so plainly, and commit the fix (step 6). It
  is not a reproach; it is what this step is for.

### 5. Confirm the merged tree is sound

A rebase can produce a tree neither person ever had. These are the checks that see it, and
they cost under a second between them:

```bash
node tools/check-markup.mjs --check
node tools/check-sitemap.mjs --check
node tools/check-card-order.mjs --check
```

Then walk the prev/next chain, because **both of you adding at the tail of the same
collection edits the same `ss-nav-next`** — and the result walks forward correctly and
breaks going back, which no gate sees. The one-liner is in `CLAUDE.md` under *the prev/next
chain follows collection order*; it must print `mismatches none · missing none`.

If one of these fails on code you did not write, **say whose commit introduced it**
(`git log -1 --format='%an' -S'<the broken bit>' -- <file>`) rather than quietly fixing
somebody's work — then offer to fix it.

### 6. Report, and commit only what regeneration produced

Tell them what landed, as editorial news rather than as a git log:

```bash
git log --oneline <before>..HEAD
git diff --name-status <before>..HEAD -- '*.html' | grep '^A'
grep -ho 'Zine No\. [0-9]\+' *.html | sed 's/Zine No\. //' | sort -n | tail -1
```

Say: which pieces are new and what each one is, what the next free zine number is now, and
anything that needs a decision. **If they were building under a number that has just been
taken, lead with that** — renumbering is free before a push and impossible after it.

Then:

- **Derived files changed in step 4** → commit them (`git add` the generated files, a
  message naming whose piece they were stale for) and offer to push. **Do not push without
  being asked** — a push publishes.
- **Local commits waiting** (`ahead N`) → say so and point at `ship-zine`. Don't push them
  as a side effect of a sync.
- **Nothing changed** → say the checkout is current and stop. A sync that found nothing
  should take one line to report, not a summary.

---

## Notes

- **Never `git push` from here.** Syncing is pulling. Publication is `ship-zine`, and it is
  a separate, deliberate act because pushing to `main` deploys to starstuff.earth.
- **Never `git reset --hard`, `git checkout .`, or `git stash drop`.** If the tree is in a
  state this skill cannot resolve, stop and describe it. Uncommitted zine work is not in
  git's history and cannot be recovered from it.
- **Never rewrite a commit that is already on the remote**, including `--amend` on a pushed
  commit. The other person has it.
- `--quick` everywhere is fine for orienting. Before a ship, run the full thing: the search
  index is the file that goes stale most usefully and it is the one `--quick` skips.
- The working agreement this automates is `CONTRIBUTING.md`; the reasoning is `CLAUDE.md` →
  *Two people work here*.
