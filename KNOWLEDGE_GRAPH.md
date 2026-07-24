# Knowledge Graph + GraphRAG

Local, self-hosted GraphRAG over the portfolio's content: a **Neo4j** knowledge
graph with a **native vector index**, embeddings from **Ollama**
(`nomic-embed-text`), answers from **llama3** — nothing leaves the machine.

```
GitHub API + content.ts ─▶ ingest ─▶ [ Neo4j: graph + vector index ] ─▶ retrieval ─▶ llama3 ─▶ grounded answer
        (source)         (pipeline)            (store)                  (GraphRAG)  (Ollama)   (+ citations + subgraph)
```

## Ownership

| Layer | File | Owner | Status |
| --- | --- | --- | --- |
| Contract (the seam) | `lib/graph-types.ts` | — | ✅ done |
| Ollama chat / embeddings | `lib/ollama.ts`, `lib/embed.ts` | — | ✅ done |
| Neo4j driver + index bootstrap | `lib/graph.ts` | — | ✅ done |
| **ETL pipeline** | `scripts/ingest.ts` | **you** | 🔧 stub w/ TODOs |
| **GraphRAG retrieval** | `lib/retrieval.ts` | **you** | 🔧 stub w/ TODOs |
| Answer endpoint (+ fallback) | `app/api/ask/route.ts` | me | ✅ done |
| Subgraph viz + wiring | `components/SubgraphView.tsx`, `Navigator.tsx` | me | ✅ done |

Everything talks through `retrieve()` in `lib/graph-types.ts`. Return
`{ nodes, edges, seedIds }` and the API + viz just work. Until you do,
`/api/ask` **falls back to section routing**, so the site keeps working the
whole time you build.

## One-time setup

```bash
docker compose up -d                 # Neo4j at :7474 (neo4j/password)
ollama pull nomic-embed-text         # 768-dim local embeddings
cp .env.example .env                 # optional — defaults already match compose
```

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

In Neo4j Browser (http://localhost:7474):

```cypher
MATCH (n:Entity) RETURN n.type, count(*) ORDER BY count(*) DESC;   // node census
MATCH (a)-[r:REL]->(b) RETURN a.label, r.rel, b.label LIMIT 50;    // edges
MATCH (n:Entity) RETURN n.id, size(n.embedding) LIMIT 5;           // embeddings present?
```

## Notes

- **Windows/Ollama:** use `127.0.0.1`, not `localhost` — Node's fetch prefers
  IPv6 and Ollama binds IPv4. Already handled in `lib/ollama.ts`.
- **Corpus is small** (~40 docs). Flat vector search alone would be fine; the
  payoff here is the graph traversal (GraphRAG) and that it scales as you add work.
- **Swapping embed models** (e.g. `mxbai-embed-large`, 1024-dim): update
  `EMBED_DIM` in `lib/embed.ts` and drop/recreate the vector index.
