# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: engineers, researchers, and recruiters who arrive from a shared link (Discord, Twitter/X, a PR thread, LinkedIn, a resume) to find out what Yaphet Lemiesa has built and whether it is real. Scene as first confirmed on 2026-09-18: late-night browser, hacker audience, a dark and motion-heavy page was allowed; superseded on 2026-10-04 by the user's request for a quiet, light, simple page. Requested 2026-10-04: the site should present Yaphet as a researcher first, and (after an ornate first attempt) be much simpler: one screen that does not scroll, quiet colour and type, text that loads a part of a word at a time, with Ask kept. Secondary: hackathon organizers and club contacts checking initiatives. (Scene confirmed by the user on 2026-09-18; audience roles inferred from the site's content and link targets.)

## Product Purpose

A personal portfolio for Yaphet Lemiesa (MIT EECS B.S. 2027 / M.Eng 2028; Bloomberg, NASA JPL, MIT Sloan CAMS) that builds itself from live sources: repos from the GitHub API hourly, plus curated write-ups, publications, awards, open-source PRs, and initiatives in `lib/content.ts`. Success: a visitor understands within seconds that this person builds real systems across hardware, AI/ML, distributed systems, and data, and can get to a specific proof (a repo, a paper, a PR) or a contact channel without effort.

## Positioning

The site is itself a demonstration: a GraphRAG assistant ("Ask") answers questions about Yaphet by retrieving from a knowledge graph of his own work, served by Boltless, a dependency-free property-graph engine he wrote after a hosted graph database was auto-deleted. The knowledge graph of the work is the product's unique mechanism, and the user has chosen it as the redesign's centerpiece (confirmed 2026-09-18).

## Operating Context

Next.js 16 App Router on Vercel with a FastAPI/Boltless graph service bound as a private Vercel service (`BOLTLESS_URL`). The graph is ingested offline (`scripts/ingest.ts` → `scripts/build_snapshot.py` → `backend/graph_data/snapshot.bolt`) with Gemini embeddings; answers come from OpenRouter. Unauthenticated GitHub calls are rate-limited; an empty Projects section is the known failure mode and must render as an honest empty state. Reduced-motion users must get a static, complete page.

## Capabilities and Constraints

Must survive the redesign untouched (user-confirmed 2026-09-18):
- The Ask / GraphRAG feature: natural-language questions to `/api/ask`, answers with citations, section routing fallback via `/api/navigate`. (The interactive drawing of the retrieved subgraph was dropped with the simplification of 2026-10-04; citations link into the views instead.)
- The live GitHub project feed: `lib/github.ts`, domain classification (hardware / ai_ml / systems / data), filter tags (Featured, AI, Hardware, Systems, Data, All), the pinned set, per-project write-ups (what / why / learned), visuals in `public/projects`, live URLs.
- All current sections and their copy: hero intro, projects, awards, publications, open source, initiatives (with `/initiatives/[slug]` pages), contact/footer. Added 2026-10-04: a Research view (statement and four threads regrouping facts already on record) and an Experience view. Deliberately no longer shown on the page since the simplification of 2026-10-04, though still in the knowledge graph for Ask: skills, coursework, project images, the what-I-learned write-ups, the domain filter tags and the non-featured repositories. Initiative pages now open inside the Community view; `/initiatives/[slug]` redirects there.
The portrait (`public/photo.jpg`) is available but not required above the fold.
Section ids in `lib/sections.ts` are shared with the navigator and must keep working.
Terminology: "Ask" is the assistant; "Projects" is the repo grid; domains are Hardware, AI / ML, Systems, Data.

## Brand Commitments

Name: Yaphet Lemiesa. Voice: first person, plain, specific, self-aware ("MIT, NASA, & Bloomberg work stays private... Ask and I will walk you through it"). No invented metrics; every number on the page traces to GitHub, Google Scholar, or the resume. Neither earlier look (the "drafting sheet / blueprint", then the clear-line comic album) is a commitment; on 2026-10-04 the user asked for a complete revamp with nav bar navigation and a loading transition, and delegated the direction.

## Evidence on Hand

- Live GitHub repos (22 at last render), 9 with real screenshots/artifacts in `public/projects/`.
- Three publications (one with 10 citations), three awards, six open-source PRs, three initiatives, all in `lib/content.ts`.
- Work experience, education, coursework and skills in `lib/content.ts`, rendered in the Experience section and used by the knowledge graph; resume projects there feed the graph only.
- Knowledge graph snapshot in `backend/graph_data/` and the ingest pipeline that produces it.
- Portrait at `public/photo.jpg`.
Absent: testimonials, client logos, traffic numbers. Do not fabricate.

## Product Principles

1. Prove, don't describe: the site demonstrates retrieval over the work rather than talking about it.
2. Live over static: anything that can come from a source of truth does.
3. Honest gaps: missing write-ups, rate-limited feeds, and unrun pipelines are stated, never papered over.
4. One centerpiece, everything else quiet: the graph leads; sections serve it.
5. Works without the model: every fact is reachable from the bar and by keyboard even if Ask is down.

## Accessibility & Inclusion

Keyboard-reachable navigation and graph nodes; visible focus; `prefers-reduced-motion` yields a static, complete page; contrast at WCAG AA.
