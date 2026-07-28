# Knowledge Graph + GraphRAG

GraphRAG over the portfolio's content: a **Neo4j** knowledge graph with a
**native vector index**, embeddings from the **Gemini API**
(`gemini-embedding-001`), answers from **OpenRouter**
(defaults to a free model — see `.env.example`).

```
GitHub API + content.ts ─▶ ingest ─▶ [ Neo4j: graph + vector index ] ─▶ retrieval ─▶ OpenRouter ─▶ grounded answer
        (source)         (pipeline)            (store)                  (GraphRAG)   (chat)       (+ citations + subgraph)
```

Both embeddings and chat now run as hosted API calls rather than against a
local Ollama server, so this works wherever the site is deployed (Vercel,
etc.) — not just on a machine running `ollama serve`. Neo4j still needs to be
reachable from wherever the app runs: use Neo4j Aura Free
(https://console.neo4j.io) for anything beyond local dev.

## Ownership

| Layer | File | Owner | Status |
| --- | --- | --- | --- |
| Contract (the seam) | `lib/graph-types.ts` | — | ✅ done |
| OpenRouter chat | `lib/llm.ts` | — | ✅ done |
| Gemini embeddings | `lib/embed.ts` | — | ✅ done |
| Neo4j driver + index bootstrap | `lib/graph.ts` | — | ✅ done |
| **ETL pipeline** | `scripts/ingest.ts` | **you** | 🔧 stub w/ TODOs |
| **GraphRAG retrieval** | `lib/retrieval.ts` | **you** | 🔧 stub w/ TODOs |
| Answer endpoint (+ fallback) | `app/api/ask/route.ts` | me | ✅ done |
| Subgraph viz + wiring | `components/SubgraphView.tsx`, `Navigator.tsx` | me | ✅ done |

Everything talks through `retrieve()` in `lib/graph-types.ts`. Return
`{ nodes, edges, seedIds }` and the API + viz just work. Until you do,
`/api/ask` **falls back to section routing**, so the site keeps working the
whole time you build. It also falls back the same way if Neo4j or the Gemini
embeddings call isn't reachable — the subgraph visualization only renders
when a GraphRAG answer actually comes back grounded (`grounded: true`).

## One-time setup

**Local dev:**
```bash
docker compose up -d                 # Neo4j at :7474 (neo4j/password)
cp .env.example .env                 # fill in OPENROUTER_API_KEY + GEMINI_API_KEY
```

**Production (or any non-local deploy):**
1. Create a free Neo4j Aura instance at https://console.neo4j.io — save the
   generated `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` (the password is
   only shown once).
2. Get an OpenRouter key at https://openrouter.ai/settings/keys.
3. Get a Gemini API key at https://aistudio.google.com/apikey (free tier).
4. Set all of the above as environment variables on your host (e.g. Vercel
   project settings), then run `npm run ingest` once against the Aura
   instance to populate it.

The vector index is created for you by `ensureVectorIndex()` on the first
ingest run (768-dim, cosine, over `:Entity(embedding)`).

## Your loop

```bash
npm run ingest      # build the graph (idempotent — re-run any time)
npm run dev         # ⌘K → ask a question → grounded answer + subgraph
```

1. **`scripts/ingest.ts`** — fill the `TODO(you)` sections: turn repos / papers /
   awards / initiatives / OSS into `GNode`s and `GEdge`s. `upsertNode` +
   `upsertEdge` show the Neo4j write pattern; the modeling is yours.
2. **`lib/retrieval.ts`** — fill the `TODO(you)` sections: embed the query →
   `db.index.vector.queryNodes` for seeds → traverse `hops` → return the
   subgraph. The exact Cypher is in the comments.

## Inspect what you built

In Neo4j Browser (local: http://localhost:7474, Aura: the console's built-in
browser):

```cypher
MATCH (n:Entity) RETURN n.type, count(*) ORDER BY count(*) DESC;   // node census
MATCH (a)-[r:REL]->(b) RETURN a.label, r.rel, b.label LIMIT 50;    // edges
MATCH (n:Entity) RETURN n.id, size(n.embedding) LIMIT 5;           // embeddings present?
```

## Notes

- **Corpus is small** (~40 docs). Flat vector search alone would be fine; the
  payoff here is the graph traversal (GraphRAG) and that it scales as you add work.
- **Rate limits:** Gemini's free embedding tier is 1,500 requests/day — fine
  for this corpus size and normal traffic, but `scripts/ingest.ts` should
  avoid re-embedding unchanged content on every run if that ever becomes a
  concern.
- **Swapping the chat model:** just change `OPENROUTER_MODEL` in your env —
  no code change needed (see `.env.example` for the free-vs-paid tradeoff).
- **Swapping embed models:** update `EMBED_DIM` in `lib/embed.ts` and
  drop/recreate the vector index — embeddings from different models/spaces
  aren't comparable, so this also means re-running `npm run ingest`.
