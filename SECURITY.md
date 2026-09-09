# Security Policy

## How to report

**Use GitHub's private vulnerability reporting:**
[**Open a draft advisory**](https://github.com/Stimpunks/Star-Stuff/security/advisories/new).

That channel is private until we publish it, which is what you want and what an
issue on this repository is not — issues here are world-readable the moment you
open one. If you would rather not use GitHub at all, reach us through
[stimpunks.org](https://stimpunks.org/) and say only that you have a security
report; we will find a private route back to you before you send details.

This policy is also published as
[`/.well-known/security.txt`](https://starstuff.earth/.well-known/security.txt),
per RFC 9116.

## What this thing actually is, so you don't waste your time

**[starstuff.earth](https://starstuff.earth/) is a static site.** There is no
application server, no database, no accounts, no login, no session, no user
input that reaches us, and no server-side code of ours anywhere. It is a
directory of hand-written HTML files served by Netlify.

That shape rules out most of what a report usually concerns:

- **No authentication, so no auth bypass.** There is nothing to log in to.
- **No forms that submit anywhere.** The one `<form>` on the site is the search,
  and it is `onsubmit="return false"` — matching happens in your browser against
  a JSON index, and the query never leaves the page.
- **No cookies, no `localStorage`, no `sessionStorage`, no browser storage of any
  kind.** Nothing to steal from a reader's device, and no session to fix.
- **No third-party JavaScript.** One 8.7 KB file of ours, which handles page
  turning and deep links and makes no network request.
- **No secrets in the repository**, because there is nowhere to put one. Builds
  are `git push`; the tools in `tools/` are local dev scripts.

**What is in scope, and is worth telling us about:**

- Anything that lets a third party change what a reader sees — a
  header misconfiguration in [`_headers`](_headers), a way around the
  `frame-ancestors` policy, a redirect in [`_redirects`](_redirects) that can be
  made to send readers somewhere we did not intend.
- **Cross-site scripting through content.** Several field guides build their
  entries from JavaScript object literals in the page; if a value can break out
  of its template and execute, we want to know.
- A supply-chain problem in a file we serve — the self-hosted fonts in
  [`fonts/`](fonts/), or the generated `search-index.json`.
- Anything that de-anonymises a reader, or that makes the site contact a third
  party we have not disclosed on
  [the privacy page](https://starstuff.earth/privacy.html). We take that one
  seriously and we have already got it wrong once: every page fetched its
  typefaces from Google until 9 September 2026, which we found by writing that
  page and published as a correction rather than a quiet fix.

**Out of scope:** missing headers with no demonstrated impact on a static site,
scanner output with no working proof, absence of a Content Security Policy
`script-src` (we know; every page carries an inline `<style>` and many an inline
`<script>`, so a real policy needs nonces, and
[the privacy page says so](https://starstuff.earth/privacy.html)), and anything
about Netlify's or GitHub's own infrastructure — report those to them.

## What you can expect from us

**We are a small nonprofit and we are honest about our capacity.** Stimpunks'
own contact page says it plainly: we cannot usually move at the speed of
emergencies, and we sometimes take a week or two off for self-care. So:

- We will acknowledge a report when we see it. If a week passes with no reply,
  send it again — that is us missing it, not ignoring you.
- We will tell you what we found and what we changed.
- **We will publish the fix and credit you if you want credit**, in
  [the changelog](https://starstuff.earth/changelog.html), which is where we
  publish our own errors by date. Naming what we got wrong in public is the
  method here, not an embarrassment to bury.
- There is no money. We have no bug bounty and we are not going to pretend
  otherwise. If that makes this not worth your time, that is a fair call.

## Please don't

Run scans that degrade the site for readers, or test anything against
`stimpunks.org` or `morerealms.com` — those are different systems on different
hosts and this policy does not cover them.

---
*Love you down to your star stuff.* **L★S**
