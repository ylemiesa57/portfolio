# backend/

A small FastAPI service wrapping [Boltless](https://github.com/ylemiesa57/boltless)
— this is the `graph` Vercel Service declared in `../vercel.json`, reachable
from the Next.js app (`web`) only over a private binding, never publicly.
See `../KNOWLEDGE_GRAPH.md` for the full picture.

## Local dev

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Serves on `http://localhost:8000` by default — `lib/graph.ts` in the Next.js
app falls back to that URL when `BOLTLESS_URL` isn't set, so local dev needs
no extra configuration.

```bash
curl http://localhost:8000/health
```

## Endpoints

- `GET /health` — `{"ok": true, "nodes": N, "edges": M}`, or `{"ok": false,
  "error": "..."}` if `graph_data/snapshot.bolt` hasn't been generated yet
  (run `npm run ingest` from the repo root first).
- `POST /retrieve` — body `{"embedding": [...], "k": 5, "hops": 1, "top_n":
  14}`, returns `{"nodes": [...], "edges": [...], "seedIds": [...]}` per
  Boltless's `RetrievalResult.to_dict()`.

## Why this exists as a separate service

Vercel Functions have no persistent disk, so the graph is loaded fresh from
the bundled, committed `graph_data/snapshot.bolt` on each cold start rather
than written to live. Updating the graph means re-running ingest and
redeploying — see `../KNOWLEDGE_GRAPH.md`.
