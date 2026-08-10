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

SKS="${STIMPUNKS_KNOWLEDGE_SYSTEM:-/Users/ryan/Documents/Claude/Projects/Stimpunks Knowledge System}"

if [ ! -d "$SKS" ]; then
  echo "sks-search: no Stimpunks Knowledge System at:" >&2
  echo "  $SKS" >&2
  echo "Set STIMPUNKS_KNOWLEDGE_SYSTEM to its path, or edit this script." >&2
  exit 3
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
