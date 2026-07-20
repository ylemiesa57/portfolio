# blueprint

A portfolio that doesn't hold its own content — it draws straight from the
GitHub API at build/request time (Next.js `revalidate`, hourly), styled as a
drafting sheet: title block, circuit-trace hero, module cards for each repo,
an oscilloscope-style activity trace.

No CMS, no hardcoded project list. Push a new repo to GitHub and it shows up
here on the next revalidation.

## Stack

Next.js 16 (App Router), TypeScript, hand-written CSS Modules (no UI
framework/utility CSS — the layout is bespoke enough that utility classes
fought more than they helped).

## Run locally

```bash
npm install
npm run dev
```

Visits `https://api.github.com/users/<username>` and
`/users/<username>/repos` at request time — no auth required for public data.
Set `GITHUB_TOKEN` (see `.env.example`) if you hit the unauthenticated rate
limit.

## Deploy

Yaphet has final say on deploy plan -- ask him!
- `lib/github.ts` — GitHub REST client + repo → domain classification
  (hardware / AI-ML / systems / data), used to group modules and drive the
  hero's circuit-trace nodes.
- `components/` — `TitleBar`, `Hero` (+ `CircuitTrace` signature element),
  `RepoGrid`, `ActivitySignal`, `Footer`.
- `app/page.tsx` — fetches user + repos + events, composes the page.
