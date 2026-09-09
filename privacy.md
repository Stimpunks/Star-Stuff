---
title: "Privacy"
url: "https://starstuff.earth/privacy.html"
updated: "2026-09-09"
description: "What this site knows about you, stated exactly. No accounts, no cookies, nothing stored on your device, and a search that runs in your browser. Our host counts pageviews server-side and processes IP addresses to do it. Thirteen pages of embedded players still contact Google and Spotify when they load — and youtube-nocookie promises less than its name suggests. Written the day we stopped loading fonts from Google, because the honest sentence was unwriteable until then."
collection: "Notes & Rationale"
licence: "CC-BY-SA-4.0"
licence_url: "https://creativecommons.org/licenses/by-sa/4.0/"
fact_check: "https://github.com/Stimpunks/Star-Stuff/blob/main/FACTCHECK.md"
generated_by: "tools/build-markdown.mjs, from the page's own <main> landmark"
---

[Stimpunks](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Rationale · Privacy

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · Working Paper

# What This Site Knows *About You*

Almost nothing, and this page says exactly which almost. No accounts, no cookies, nothing written to your device, and a search that runs entirely inside your browser.

What is left is small and worth naming rather than rounding to zero: our host counts pageviews from the requests it already handles, and it treats distinct IP addresses as distinct visitors. Embedded players on 13 of the 198 pages still reach a third party the moment those pages load. And until the day this page was written, every single page you opened here fetched its typefaces from Google.

---

Published 9 September 2026 · the state of the site on that date

The short version

**We do not want your data and we have not built anything to collect it.** There is no account to make, no newsletter, no comment box, no analytics script, no advertising, no A/B test and no third-party tag of any kind. The only script this site loads is [one 8.7 KB file of our own](https://starstuff.earth/starstuff.js), which handles page turning and deep links and makes no network request at all. Exactly one page fetches anything: [the search](https://starstuff.earth/search.html) downloads its index from this domain.

**What remains is one thing we do and one thing we ask your browser to do.** Our host counts pageviews. Thirteen pages — the eight song racks and five others — load embedded players from Google, two of them from Spotify as well. Both are below, in the detail a reader would need to decide whether to care.

There is a second privacy policy, and it is not about this page

The Stimpunks Foundation publishes [a privacy policy for stimpunks.org](https://stimpunks.org/privacy/), and **almost none of it describes this site.** That one covers a WordPress site with comments, logins, contact forms, Gravatar, and form data flowing into HubSpot and QuickBooks — because that is what stimpunks.org is. **starstuff.earth has no comments, no login, no forms and no CRM**, so reading across from that document to this one would leave you expecting cookies and processors that do not exist here.

Where the two agree is worth quoting, because it is the same organisation: *“We will not sell or give your data to third parties. We will not use your information to market anything to you.”* And on server logs it says the same thing this page does — *“Your IP address will be captured in our server logs.”*

## Nothing is written to your device

No cookies. Not “no advertising cookies” or “only essential cookies” — **none at all.** Nor `localStorage`, `sessionStorage`, IndexedDB, or any other browser storage. This is checkable rather than promised: the whole site is [a public repository of static HTML files](https://github.com/Stimpunks/Star-Stuff), and the strings that would have to appear in it do not appear anywhere in it.

**That is why there is no cookie banner here, and its absence is the honest kind.** A consent prompt is required for storage that is not strictly necessary. We set no storage, so there is nothing to consent to and nothing to decline — and a banner that asked you to agree to nothing would be theatre, plus one more thing to click.

**The search is the case that shows the shape of it.** [Search](https://starstuff.earth/search.html) downloads a single index file from this domain and then does all the matching inside your browser. Your query is never sent anywhere, because there is no endpoint to send it to. Nothing about it is logged, because nothing about it leaves the page. You can turn off your network connection after the page has loaded and the search still works.

## What our host records, and what we look at

This site is served by [Netlify](https://www.netlify.com/), and **Netlify Web Analytics is enabled.** That is the one measurement we take, and it is worth being precise about how it works, because “analytics” usually means something much more invasive than this.

It is collected **server-side**, from the requests Netlify already has to handle in order to send you a page. Netlify's own documentation says the collection *“complies with the General Data Protection Regulation (GDPR), has no impact on site performance, is not stopped by ad blockers, and does not require any extra configuration.”* No script runs in your browser for it, so nothing it does can write anything to your device — which is also why an ad blocker cannot switch it off, and we would rather say that plainly than let you assume otherwise.

*What the analytics panel shows us*

| What we see | What it is, in Netlify's own terms |
| --- | --- |
| Pageviews | *“instances of your project's pages being served”* — a count, with no person attached |
| Unique visitors | *“different IP addresses engaging with your project”*. **This is the part that touches you.** Counting distinct visitors means processing IP addresses, which are personal data in the EU and UK. We never see a list of them and cannot look one up; we see a number |
| Top locations | countries, derived from those addresses — not towns, not streets |
| Top pages | which pages were served most |
| Pages not found | the broken links people arrive at, which is how we find our own mistakes |

**What we actually do with it is duller than it sounds.** We check whether anybody is reading, and we look at the not-found list to fix links we have broken. [Our own changelog](https://starstuff.earth/changelog.html) records the pageview figures being mostly crawlers rather than people. There is no funnel, no cohort, no retargeting, and nothing is joined to anything else.

Netlify is our data processor, and their handling of it — including how long the underlying request data is kept — is theirs to state, not ours to paraphrase: [Netlify's privacy statement](https://www.netlify.com/privacy/). Their documentation mentions backfilling up to 30 days of history when analytics is switched on; we have not tried to derive a retention period from that, and would rather point you at them than guess.

## Who else your browser contacts

**On most pages, nobody.** Open a zine, a field guide or a broadside and every single request goes to this domain. That became true on the day this page was published, and the reason is the next section.

### The playlists and racks embed players, and those reach out

The [Sound](https://starstuff.earth/collection-sound.html) collection is built out of songs, and each song card carries an embedded YouTube player. There are **292 of them, on 13 of the site's 198 pages**: 269 across the [eight racks](https://starstuff.earth/collection-sound.html), and 23 more on four music zines and on [Love You Down To Your Star Stuff](https://starstuff.earth/love-you-down-to-your-star-stuff.html), which is one of the three doors into the collection and the one worth knowing about. Two of those cards carry a Spotify player as well. An embedded player is a frame loaded from somebody else's server, so **when one of those pages loads, Google (and on two cards, Spotify) receives a request from your browser, and therefore your IP address and user-agent, whether or not you press play.**

Every one of those YouTube frames uses the privacy-enhanced player at `youtube-nocookie.com` rather than the ordinary one. **That is worth having and it is narrower than its name suggests**, so here is what Google actually claims for it, in their words: it *“prevents the use of views of embedded YouTube content from influencing the viewer's browsing experience on YouTube”*, any ads shown on such a video *“will likewise be non-personalized”*, and the view *“will not be used to personalize advertising shown to the viewer outside of your site or app.”*

Read that carefully, because we did not at first

**Every one of those promises is about personalisation, not about collection.** Google does not say the request is not made, that nothing is logged, or that no cookie is ever set — only that what you watch in one of our embeds will not be used to shape what YouTube shows you later. The domain name says *nocookie*; the documentation says *non-personalised*. Those are different claims and the second is the one on offer.

We moved 66 remaining embeds onto that host earlier the same day this page was written, and described it in [the changelog](https://starstuff.earth/changelog.html) as the cheapest privacy win available. That was true, and it was also the point at which we should have read the small print rather than the domain name. **We have not independently verified any of Google's claim.** It is their statement about their own service, quoted as such.

**So: if you would rather not be seen by Google, it is those 13 pages — the eight racks, four music zines and that one door — and everything else here is free of it.** Blocking third-party frames costs you nothing but the players; the writing, the sources and the argument are all in the page itself, and the racks list every song in text with ordinary links you can choose to follow.

### The fonts, until today

Until 9 September 2026, every page on this site loaded its typefaces from `fonts.googleapis.com` and `fonts.gstatic.com`. That meant **every page view, on every page, handed Google your IP address and user-agent** before a word was rendered — on a site with no analytics script, no cookies and a search that never leaves your browser. The fonts were quietly the largest thing we were giving away, and they were giving it away on pages that had nothing else on them.

Writing this page is what found it. The sentence “most pages contact nobody” was simply not true, and it could not be made true by rewording.

All four families are now served from this domain. They are unmodified, they are all under the [SIL Open Font License 1.1](https://openfontlicense.org/), and each licence [ships beside the files](https://github.com/Stimpunks/Star-Stuff/tree/main/fonts) as that licence requires. The files are the exact set Google was serving, mirrored one for one, so the type on the page is unchanged — and on eight pages it is now *more* correct than it was, because those pages had been using a family they never actually requested.

Not:

- **Not a consent dialog.** There is nothing to consent to. A banner asking permission for storage we do not set would be a costume, and it would train you to click through the ones that matter.
- **Not “we value your privacy” over a list of 400 partners.** We have no partners. Nothing here is shared with anyone, because nothing here is collected to share.
- **Not anonymised.** We are not claiming that word. An IP address is processed to count you; we simply never receive it. Saying *anonymous* would be a stronger claim than we can support.
- **Not a promise about anybody else's servers.** What Netlify, Google and Spotify do is theirs to state, and we link to them rather than summarise them into something more comforting than the original.
- **Not finished.** The embeds are a live trade we are making on your behalf, and it is marked as one above rather than filed as settled.

## If you are in the EU or the UK

**The Stimpunks Foundation is the controller** for this site; Netlify is a processor acting on our instructions. The lawful basis for the two things described above is **legitimate interests**: serving a page you asked for necessarily involves handling your request, and an aggregate count of pageviews is the minimum needed to know whether publishing this is worth doing. There is no consent basis in play because there is no non-essential storage to consent to.

**You have the usual rights — access, rectification, erasure, objection, restriction — and the honest answer to most of them here is that there is nothing on our side to exercise them against.** We hold no account, no email address, no profile and no identifier for you. If you write and ask what we hold about you, the truthful reply is *nothing that could be linked to you*, and we would rather say that in advance than make you ask. If you want your data removed from our host's aggregate counts, that request has to go to Netlify, and their statement above is the route.

**You also have the right to complain to a supervisory authority**, and you do not have to come to us first. In the EU that is the data protection authority for your country (the [EDPB lists them all](https://www.edpb.europa.eu/about-edpb/about-edpb/members_en)); in the UK it is the [Information Commissioner's Office](https://ico.org.uk/make-a-complaint/).

### Where the processing happens

**Our host is in the United States, and so are Google and Spotify.** If you are reading this from the EU or the UK, serving you a page therefore involves a transfer outside your jurisdiction. The safeguards for that are the processors' own — Netlify's statement describes the mechanisms it relies on, including standard contractual clauses — and we link rather than restate, because a summary of somebody else's legal basis written by us would be less reliable than theirs.

### How long anything is kept

**We keep nothing, because we receive nothing to keep.** There is no database on our side, no logs of our own, no mailing list and no file with anything of yours in it. The only retention question that applies is our host's: Netlify holds the request data behind the pageview counts, and [their statement](https://www.netlify.com/privacy/) is the authority on how long. The criterion we apply on our side is the only one available to us — **we do not create a store to retain from.**

### Contact

**The controller is the Stimpunks Foundation**, a 501(c)(3) nonprofit. Ask us anything about this page, or tell us it is wrong: [open an issue on GitHub](https://github.com/Stimpunks/Star-Stuff/issues), or use the contact routes at [stimpunks.org](https://stimpunks.org/) if you would rather not use GitHub — a reasonable preference on a privacy page. **We have not published a postal address here**, because we could not find one already public to point at rather than invent; if you need one for a formal request, ask through either route and we will give it to you.

## What we cannot promise

**This page describes the site on 9 September 2026, and a description can go out of date faster than the thing it describes.** If it stops matching the site, the page is what is wrong; the repository is the source of truth and every change to it is public. Substantive changes here get an entry in [the changelog](https://starstuff.earth/changelog.html) with a date, like everything else.

Three limits, stated rather than left to be discovered:

- **We have not audited our host or Google.** Everything above about their behaviour is their own published claim, quoted and linked. We verified what happens in our own pages, which is the part we control.
- **The repository is public, and so is anything you send us.** A GitHub issue is world-readable and carries your GitHub identity. That is a feature for corrections and a poor choice for anything you would not want indexed.
- **This is not legal advice and we are not lawyers.** It is a plain description of what the site does, written by the people who built it, which is the only kind of privacy statement we know how to make honest.

## Sources

Netlify, [“Web Analytics”](https://docs.netlify.com/monitor-sites/analytics/), Netlify Docs — the server-side collection description and the definitions of pageviews, unique visitors, top locations, top pages and pages not found, quoted above.

Netlify, [“Privacy Statement”](https://www.netlify.com/privacy/) — our processor's own statement, including data retention.

Google, [“Embed videos & playlists”](https://support.google.com/youtube/answer/171780), YouTube Help — the description of Privacy Enhanced Mode, quoted above in full on the point that matters.

SIL, [SIL Open Font License 1.1](https://openfontlicense.org/) — the licence under which all four self-hosted families are redistributed, unmodified, with their licence texts included.

The site itself: [github.com/Stimpunks/Star-Stuff](https://github.com/Stimpunks/Star-Stuff). Every claim on this page about what our pages do is checkable there, which is the point of publishing it that way.

[Stimpunks Foundation](https://stimpunks.org/) × [More Realms](https://morerealms.com/) · [starstuff.earth](https://starstuff.earth) · [Changelog](https://starstuff.earth/changelog.html) · [stimpunks.org](https://stimpunks.org) · [morerealms.com](https://morerealms.com)
 Published 9 September 2026 · Print freely · Share freely · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · L★S · We love you down to your star stuff
