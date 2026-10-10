# portfolio

A researcher's site on one quiet screen that never scrolls. A bar at the top
switches views in place (About, Research, Publications, Projects, Open
source, Experience, Community), and a single field at the foot asks a
knowledge graph of the work.

Text loads a part of a word at a time: `components/site/Reveal.tsx` splits it
into pieces of two or three letters that fade and sharpen in sequence. It is
plain CSS and is switched off under `prefers-reduced-motion`.

Ask is the GraphRAG feature. A question streams the real stages of the
retrieval (`/api/ask/stream`); the answer arrives the same way the page did,
followed by the sources it came from, each a link into the view that holds
it. Repositories still come from the GitHub API at request time (Next.js
`revalidate`, hourly).

No CMS, no hardcoded project list. Push a new repo to GitHub and it shows up
here on the next revalidation.

## Stack

Next.js 16 (App Router), TypeScript, hand-written CSS Modules (no UI
framework/utility CSS), two fonts: STIX Two Text for reading, Archivo for
the bar, lists and small print.
The GraphRAG side (Boltless graph service, Gemini embeddings, OpenRouter) is
described in `KNOWLEDGE_GRAPH.md`; the visual system is recorded in
`DESIGN.md`.

## Run locally

```bash
npm install
npm run dev
```

Visits `https://api.github.com/users/<username>` and
`/users/<username>/repos` at request time — no auth required for public data.
Set `GITHUB_TOKEN` (see `.env.example`) if you hit the unauthenticated rate
limit. Without `GEMINI_API_KEY` and `OPENROUTER_API_KEY` the Ask feature
says so in a line under the Ask field; `ASK_MOCK=1`
(development only) runs the narrated pipeline against the real graph with no
model, and says so.

## Deploy

Yaphet has final say on deploy plan -- ask him!

## Map

- `lib/github.ts` — GitHub REST client + repo → domain classification
  (hardware / AI-ML / systems / data), used to group projects.
- `lib/graph-build.ts` — builds the knowledge graph (nodes + edges) from the
  repos and `lib/content.ts`; shared by `scripts/ingest.ts` and the page.
- `lib/sections.ts` — the kinds of content, by the ids the graph stamps on its
  nodes; the LLM section router and the page's view map both read it.
- `lib/ask.ts` — the Ask pipeline with stage events; `/api/ask` (JSON) and
  `/api/ask/stream` (NDJSON) both call it. `/api/status` feeds the note under the Ask field.
- `components/site/` — the whole interface: `Site.tsx` (bar, views, Ask),
  `Reveal.tsx` (the part-by-part text load), `useAsk.ts` (the stream client).
- `app/page.tsx` — fetches user + repos and shapes `lib/content.ts` into the
  views. `/initiatives/[slug]` redirects into the Community view.
