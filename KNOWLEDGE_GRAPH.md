# Knowledge Graph + GraphRAG

GraphRAG over the portfolio's content: a **Boltless** graph store (a
from-scratch, zero-dependency embeddable property-graph + graph-RAG engine —
[github.com/ylemiesa57/boltless](https://github.com/ylemiesa57/boltless)),
embeddings from the **Gemini API** (`gemini-embedding-001`), answers from
**OpenRouter** (defaults to a free model — see `.env.example`).

```
GitHub API + content.ts ─▶ ingest.ts ─▶ build_snapshot.py ─▶ [ Boltless: graph + HNSW index ] ─▶ retrieval ─▶ OpenRouter ─▶ grounded answer
        (source)          (build nodes/edges,   (write snapshot)      (backend/ FastAPI service,          (GraphRAG)   (chat)       (+ citations + subgraph)
                            embed via Gemini)                          Vercel Service, private binding)
```

This replaced an earlier Neo4j Aura Free setup: the free-tier instance was
auto-paused for inactivity and then deleted, silently degrading the site to
plain section routing. Boltless removes that dependency entirely — the graph
engine is a small Python service Yaphet owns and ships as part of this same
Vercel deployment, not a third-party managed database that can expire.

## Architecture: two Vercel Services, one deployment

`vercel.json` defines two [Services](https://vercel.com/docs/services) in
this one project:

- **`web`** — the Next.js app (this repo's root). Publicly routed; the only
  public entry point (see the top-level `rewrites` rule).
- **`graph`** — the FastAPI app in `/backend`, wrapping a Boltless
  `GraphDB` + `Retriever`. **Not publicly routable.** `web` reaches it only
  through a private [service binding](https://vercel.com/docs/services/bindings),
  which injects the internal URL as `BOLTLESS_URL` at runtime — there's no
  hostname to configure, no auth token to manage, and no public surface for
  it at all.

The graph itself is a **build-time artifact**, not something written to at
request time: Vercel Functions have no persistent disk, so `npm run ingest`
produces `backend/graph_data/snapshot.bolt` locally, it gets committed, and
the `graph` service loads it fresh on each cold start (copying it into `/tmp`
first, since Boltless's WAL wants a writable directory — see
`backend/main.py`). For a graph this size (tens to low hundreds of nodes)
that whole cold-start path is low milliseconds; see Boltless's own
`BENCHMARKS.md` for the numbers at larger scale.

## Ownership

| Layer | File | Owner | Status |
| --- | --- | --- | --- |
| Contract (the seam) | `lib/graph-types.ts` | — | ✅ done |
| OpenRouter chat | `lib/llm.ts` | — | ✅ done |
| Gemini embeddings | `lib/embed.ts` | — | ✅ done |
| Boltless HTTP client | `lib/graph.ts` | — | ✅ done |
| **ETL pipeline** | `scripts/ingest.ts` + `scripts/build_snapshot.py` | **you** | ✅ done |
| **GraphRAG retrieval** | `lib/retrieval.ts` | **you** | ✅ done |
| Graph engine service | `backend/main.py` (Boltless) | — | ✅ done |
| Answer endpoint (+ fallback) | `app/api/ask/route.ts` | me | ✅ done (unchanged by this migration) |
| Subgraph viz + wiring | `components/SubgraphView.tsx`, `Navigator.tsx` | me | ✅ done |

Everything talks through `retrieve()` in `lib/graph-types.ts`. As long as it
returns `{ nodes, edges, seedIds }`, the API + viz just work — that's the
whole reason swapping Neo4j for Boltless touched exactly three files
(`lib/graph.ts`, `lib/retrieval.ts`, `scripts/ingest.ts`) and nothing else.
`/api/ask` **falls back to section routing** if the graph service or the
Gemini embeddings call isn't reachable — the subgraph visualization only
renders when a GraphRAG answer actually comes back grounded (`grounded:
true`).

## One-time setup

**Local dev:**

```bash
cd backend
pip install -r requirements.txt   # installs boltless + fastapi
uvicorn main:app --reload         # serves http://localhost:8000
```

In another terminal, from the repo root:

```bash
cp .env.example .env              # fill in OPENROUTER_API_KEY + GEMINI_API_KEY
npm run ingest                    # builds the graph, writes backend/graph_data/
npm run dev
```

`BOLTLESS_URL` doesn't need to be set locally — `lib/graph.ts` defaults to
`http://localhost:8000`.

**Production (Vercel):**

1. Get an OpenRouter key at https://openrouter.ai/settings/keys.
2. Get a Gemini API key at https://aistudio.google.com/apikey (free tier).
3. Set both as environment variables in the Vercel project settings.
   Don't set `BOLTLESS_URL` — Vercel injects it automatically via the
   `graph` service binding in `vercel.json`.
4. Run `npm run ingest` locally (or in CI) before each deploy that should
   pick up new content, commit the resulting `backend/graph_data/`, and
   deploy. There's no separate infra to provision — `vercel deploy` builds
   both services from this one repo.

## Your loop

```bash
npm run ingest      # build the graph (idempotent — re-run any time)
npm run dev          # ⌘K → ask a question → grounded answer + subgraph
```

1. **`scripts/ingest.ts`** — turns repos / papers / awards / initiatives /
   OSS into `GNode`s and `GEdge`s (unchanged logic from before the Boltless
   migration), embeds each via Gemini, and writes `graph-data/graph.json`.
2. **`scripts/build_snapshot.py`** — reads that JSON and writes it into a
   Boltless `GraphDB`, snapshotting to `backend/graph_data/`. This is the
   only place that talks to Boltless directly on the ingest side.
3. **`lib/retrieval.ts`** — embeds the query, calls the `graph` service's
   `/retrieve` (HNSW seeds → k-hop expansion → hybrid cosine +
   personalized-PageRank scoring, all inside Boltless), and maps the
   response onto `GNode`/`GEdge`.

## Inspect what you built

The backend exposes a health check with node/edge counts:

```bash
curl http://localhost:8000/health
# {"ok": true, "nodes": 41, "edges": 63}
```

For anything deeper, Boltless ships a Cypher subset — open a Python shell:

```python
from boltless import GraphDB, cypher
db = GraphDB("backend/graph_data")
cypher(db.graph, "MATCH (p:Person)-[:AUTHORED]->(r:Repo) RETURN r.name LIMIT 10")
```

## Notes

- **Corpus is small** (~40 docs). Flat vector search alone would be fine; the
  payoff here is the graph traversal (GraphRAG) and that it scales as you add
  work. Boltless's own `BENCHMARKS.md` covers behavior at 1k–100k nodes if
  this ever needs to grow.
- **Rate limits:** Gemini's free embedding tier is 1,500 requests/day — fine
  for this corpus size and normal traffic.
- **Swapping the chat model:** just change `OPENROUTER_MODEL` in your env —
  no code change needed (see `.env.example` for the free-vs-paid tradeoff).
- **Swapping embed models:** update `EMBED_DIM` in `lib/embed.ts`, then
  re-run `npm run ingest` — embeddings from different models/spaces aren't
  comparable, and Boltless's HNSW index gets rebuilt from the new snapshot
  automatically the next time the `graph` service cold-starts.
- **Updating the graph in production:** there's no live write path by
  design (see Architecture above) — re-run `npm run ingest`, commit
  `backend/graph_data/`, and redeploy.
