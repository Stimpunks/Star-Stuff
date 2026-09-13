#!/usr/bin/env bash
#
# sks-search.sh — query the Stimpunks Knowledge System (SKS) from Star Stuff.
#
# WHY THIS WRAPPER EXISTS
# qmd's index is project-local and there is no --root/--db flag, so qmd must run
# with SKS as its working directory. Run from anywhere else it does not error —
# it prints "No results found." and exits 0. That silent empty result is worse
# than a crash: a caller concludes the garden holds nothing on the subject and
# moves on. This wrapper makes the wrong-location case fail loudly instead.
#
# It is a passthrough. Every qmd subcommand and flag works:
#   tools/sks-search.sh search "scenius" -n 12
#   tools/sks-search.sh search "carcinization" -c highlights -n 10
#   tools/sks-search.sh query "why does switching tasks hurt"
#   tools/sks-search.sh get '#4a68ee'
#   tools/sks-search.sh status
#
# SKS is a separate repo and is never a citation. See the `sks-search` skill for
# the find-vs-verify boundary before using anything this returns in a zine.
set -euo pipefail

# WHERE SKS IS, and why this is a search rather than a constant.
# It used to default to Ryan's path outright. SKS gained a second contributor on
# 2026-09-13, and a clone does not land in the same place twice: `git clone` names the
# folder Stimpunks-Knowledge-System, while Ryan's own checkout predates the repo and sits
# under Documents/Claude/Projects with spaces in the name. Hardcoding either spelling makes
# the other person's setup look broken on day one.
#
# STIMPUNKS_KNOWLEDGE_SYSTEM always wins. Otherwise try the likely places, nearest first —
# a sibling of this repo, then the usual GitHub folder, then Ryan's. If none of them exist,
# say which ones were tried; "not found" with no list is a dead end for whoever hits it.
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SKS=""
if [ -n "${STIMPUNKS_KNOWLEDGE_SYSTEM:-}" ]; then
  SKS="$STIMPUNKS_KNOWLEDGE_SYSTEM"
  if [ ! -d "$SKS" ]; then
    echo "sks-search: STIMPUNKS_KNOWLEDGE_SYSTEM is set but there is nothing there:" >&2
    echo "  $SKS" >&2
    echo "Fix the variable, or unset it to fall back to the usual locations." >&2
    exit 3
  fi
else
  CANDIDATES=(
    "$(dirname "$REPO")/Stimpunks-Knowledge-System"
    "$HOME/Documents/GitHub/Stimpunks-Knowledge-System"
    "$HOME/Documents/Claude/Projects/Stimpunks Knowledge System"
  )
  for c in "${CANDIDATES[@]}"; do
    if [ -d "$c" ]; then SKS="$c"; break; fi
  done
  if [ -z "$SKS" ]; then
    echo "sks-search: no Stimpunks Knowledge System found. Tried:" >&2
    for c in "${CANDIDATES[@]}"; do echo "  $c" >&2; done
    echo "Clone it, or point at it explicitly:" >&2
    echo "  export STIMPUNKS_KNOWLEDGE_SYSTEM=\"/path/to/Stimpunks-Knowledge-System\"" >&2
    exit 3
  fi
fi

if [ ! -f "$SKS/.qmd/index.sqlite" ]; then
  echo "sks-search: found SKS but no qmd index at $SKS/.qmd/index.sqlite" >&2
  echo "Build it there with: qmd update && qmd embed  (or the repo's reindex skill)." >&2
  echo "Refusing to run: without an index qmd returns 'No results found.' and exits 0," >&2
  echo "which reads exactly like a real absence." >&2
  exit 3
fi

if ! command -v qmd >/dev/null 2>&1; then
  echo "sks-search: qmd is not on PATH. Install with: npm install -g @tobilu/qmd" >&2
  exit 3
fi

# `qmd get`/`multi-get` resolve on basename and can silently hand back a
# different file than the path you asked for. The documented case returns
# wiki/concepts/tendril-theory.md when you ask for the stimpunks.org glossary
# page of the same name — and concept pages are AI-written synthesis we may
# never cite. Reproduced on qmd 2.5.3. Addressing by #docid is the only safe form.
case "${1:-}" in
  get|multi-get)
    case "${2:-}" in
      '#'*) ;;
      *)
        echo "sks-search: WARNING — '$1' by path or basename can silently return a" >&2
        echo "  different file, including a wiki/concepts page (never citable)." >&2
        echo "  Use the #docid from the search result instead. Verify what you opened." >&2
        ;;
    esac
    ;;
esac

cd "$SKS"
exec qmd "$@"
