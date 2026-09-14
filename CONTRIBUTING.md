# CONTRIBUTING.md — Star Stuff

Two people work in this repo: **Ryan Boren** (Stimpunks Foundation) and **Helen Edgar**
(More Realms). Both push to `main`. Pushing to `main` deploys to
<https://starstuff.earth/> through Netlify, with no build step — so **a push is a
publication**, and everything below exists because of that one fact.

This file is the *how we work together* document. Two others sit beside it and are not
replaced by it:

- **[CLAUDE.md](CLAUDE.md)** — what the project is, how a page is built, and every
  house convention. Read it before writing a page. It is long on purpose.
- **[FACTCHECK.md](FACTCHECK.md)** — the attribution rules and the per-piece ledger.
  Every piece owes a row.
- **[DECISIONS.md](DECISIONS.md)** — what we settled, and what is still open.

---

## Setting up a checkout

No install step, no dependencies, no build. Clone it and open a page.

```bash
cd ~/Documents/GitHub
git clone git@github.com:Stimpunks/Star-Stuff.git
cd Star-Stuff
node tools/check-derived.mjs --quick     # ~4s; proves the toolchain works
```

Nothing requires that location — every tool resolves the repo root from its own path — but
`tools/sks-search.sh` looks for the Knowledge System **beside this repo first**, and at
`~/Documents/GitHub/Stimpunks-Knowledge-System` second. Clone both here and either rule finds
it, with no `STIMPUNKS_KNOWLEDGE_SYSTEM` to set.

What the tools need:

| | |
|---|---|
| **Node 22+** | every tool in `tools/` is a plain `.mjs` with no packages |
| **Chrome** | nine of the tools drive headless Chrome over CDP — the search index, and the contrast, overlap, classes, dead-CSS, forced-colours, sheet-fitting, edit-UI and icon tools |
| **Python 3** | optional — `python3 -m http.server` is the alternative to `tools/serve.mjs` |
| **nothing else** | no npm, no bundler, no framework. The site is self-contained HTML |

Look at a page over HTTP, never `file://`. A `file://` page treats its own linked
stylesheet as cross-origin and cannot read its `.cssRules`, which is why
`check-classes.mjs` and `check-dead-css.mjs` both spawn this server rather than
opening files — and why a page you are eyeballing should come through it too:

```bash
node tools/serve.mjs 8799     # any port; defaults to 8765
```

**The Stimpunks Knowledge System is optional and separate.** `tools/sks-search.sh`
searches it if you have it checked out; it finds it by `STIMPUNKS_KNOWLEDGE_SYSTEM`,
then by looking beside this repo, then in `~/Documents/GitHub/`. Without it the script
lists the paths it tried and exits 3 — it never returns a silent empty result. Two of
its corpora (`highlights`, `notes`) are Ryan's Readwise and Ulysses exports, so a
search that comes back thin on Helen's machine is a difference in the library, not in
the query.

---

## The push loop

This is the only genuinely new rule, and it is new because a rebase can leave a
derived file describing a site that no longer exists.

```bash
git pull --rebase                     # somebody else's pages are now in your tree
node tools/check-derived.mjs --write  # regenerate all five, in dependency order
node tools/check-derived.mjs          # and every other gate you need — see below
git add -A && git commit -m "…" && git push
```

**Why `--write` after a rebase, every time.** Five generators here write files that are
*copies* of the rest of the site — `whats-new.html`, `feed.xml`, `llms.txt`,
`.well-known/security.txt`, the CSP hash list inside `_headers`, `changelog.html`, the
57 `.md` siblings, and `search-index.json`. Every one of them was generated from the
site as it stood **in your branch, before the rebase**. After the rebase the site
includes pages your generators never saw — so your search index cannot find the other
person's new zine, your feed does not list it, and `_headers` has no CSP hash for its
inline script, which on a paged zine means a **dead pager on a live page**. Nothing
about the rebase is a conflict; git is right and the files are wrong. `check-derived.mjs
--write` regenerates all five in dependency order and then checks its own work.

`--write --quick` skips the search index — the only one of the five needing Chrome — and
writes and re-checks in under ten seconds. The full run takes about three minutes,
almost all of it the index. Run the full one before pushing.

### When a derived file conflicts

Never resolve it by hand. Take either side and regenerate — the file is a copy, and
the way to settle a disagreement between two copies is to ask the thing they are
copies of.

```bash
git checkout --ours search-index.json
node tools/check-derived.mjs --write
git add -A && git rebase --continue
```

`search-index.json` is 6.1 MB on a single line and is marked `-merge -diff` in
[`.gitattributes`](.gitattributes) so git refuses to splice it rather than producing a
JSON document that parses and is wrong.

---

## Claiming a zine number

**The number says *when*.** It is chronological, it is referenced by number across
`changelog-*.html`, `FACTCHECK.md` and years of prose with no redirects, and it is
never renumbered after a push. With two people building at once, two pieces can be
built as No. 111 on the same afternoon.

The rule: **derive the number immediately before you commit, not when you start.**

```bash
grep -ho 'Zine No\. [0-9]\+' *.html | sed 's/Zine No\. //' | sort -n | tail -1
```

Run that *after* `git pull --rebase`. If the number you were building under is taken,
renumber **before the push** — the cover `.cover-issue`, the `.cover-corner-num`
watermark, the `<title>`, the card on `index.html` and on its collection page, the
`FACTCHECK.md` row and the changelog entry. After a push, renumbering is not available:
the URL is live, the number is quoted elsewhere, and the gap it would leave is
information. (`CLAUDE.md` records the single exception ever made, No. 37, and why it is
not a precedent.)

If you both land the same number anyway, the **second push renumbers**, not the first.

---

## Three places where two people collide

- **The prev/next chain.** Inserting a page means editing its two neighbours, and both
  of you adding at the tail of the same collection means editing the same file's
  `ss-nav-next`. It walks forward correctly and breaks going back — invisible unless
  you look. After every rebase, walk it: the one-liner is in `CLAUDE.md` under *the
  prev/next chain follows collection order*.
- **`index.html` and the collection pages.** Two cards inserted at the same grid's tail
  is an ordinary text conflict, but resolve it by reading, not by taking both hunks:
  `check-card-order.mjs` will catch a descent, and `check-markup.mjs`'s card-wrap check
  will catch a card that ended up inside another card's box. Run both after resolving.
- **`sitemap.xml`.** Hand-maintained, one line per page, so two additions conflict on
  adjacent lines. `check-sitemap.mjs` proves the result agrees with the filesystem.
  And **bump `lastmod` before running the generators**, not after: each `.md` sibling's
  frontmatter reads its `updated:` from that page's sitemap row.

---

## The gates

Nine gates, all at a baseline of **0**, all local dev tools — Netlify runs none of
them. `--check` is the gating mode on each; a plain run is informational.

```bash
node tools/check-markup.mjs --check        # eleven silent markup faults        0.6s
node tools/check-sitemap.mjs --check       # sitemap vs the filesystem         0.1s
node tools/check-card-order.mjs --check    # cards ascending in each grid      0.1s
node tools/check-sheets.mjs --check        # broadsides land on the paper       26s
node tools/check-derived.mjs               # is every generated file current?  ~3 min
node tools/check-classes.mjs --check       # classes that style nothing        ~2 min
node tools/check-contrast.mjs --check      # screen + print contrast           ~3 min
node tools/check-overlap.mjs --check       # text collisions, two viewports    ~5 min
node tools/check-forced-colors.mjs --check # the reader's own palette          ~9 min
```

The first three take under a second between them and catch most of what actually ships
broken; run them after any structural edit. The `ship-zine` skill runs the right subset
for the kind of change.

**Two habits the tools cannot enforce, and both have cost us a live defect:**

1. **Read the per-page numbers, not just the exit code.** A page that indexed 12% of
   itself and a page that indexed all of it print the same "ok".
2. **Open the page in a browser.** No gate can see a diagram that means the wrong
   thing, a motif drawn over the title, or a caption that says something false.

---

## Attribution, now that there are two of us

- **Commits.** Commit as yourself; `git log` is the record of who did what. Claude
  co-authorship goes in the trailer as it already does.
- **Per-piece credit stays exact.** The masthead is shared —
  *Stimpunks Foundation × More Realms*, in that order, on every page — but authorship
  is not. Where a zine is Helen's it is hers and says so, in her own voice, in the
  colophon. Where it was developed from one person's essay by the other, say that too.
- **`FACTCHECK.md` rows and `changelog.html` entries name who.** The changelog already
  does this for corrections — *"Helen Edgar's fact-check caught it"* — and that is the
  convention, not a flourish. An entry that says a thing was fixed without saying who
  found it is half an entry.
- **`DECISIONS.md` entries name who settled it.** The existing rows read *"settled
  2026-08-26, by Ryan"*. Keep that shape; with two contributors it is the only record
  of whose call a thing was.
- **Dated records are never edited backwards.** A changelog entry, a FACTCHECK row or a
  source comment that says *"Ryan's call, 2026-09-10"* was true when written and stays
  as it is, even after this file exists. Rules going *forward* are the ones that say
  "Ryan or Helen."

---

## What only Ryan can do

Not a hierarchy — these are accounts, not permissions on the work:

- **Netlify.** Deploys, the domain, deploy keys. A failed deploy reading
  `Permission denied (publickey)` is infra, not a code bug; it goes to Ryan rather than
  into a file edit.
- **GitHub repository settings.** Collaborator access, private vulnerability reporting
  (which `.well-known/security.txt` points at), branch settings.
- **`SECURITY_EXPIRES` in `tools/build-derived.mjs`.** `security.txt` carries a
  mandatory expiry; the tool exits non-zero inside 30 days of it and prints the
  countdown on every run. Bump the constant, never the generated file.

---

*Love you down to your star stuff.* **L★S**
