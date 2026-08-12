# graph_data/

Generated, not hand-edited. `npm run ingest` (from the repo root) builds the
portfolio's knowledge graph from GitHub + `lib/content.ts`, embeds every node
via Gemini, and calls `scripts/build_snapshot.py` to write it into a Boltless
`GraphDB`, which snapshots here as `snapshot.bolt` (+ an empty `wal.bolt`).

This folder is committed to the repo on purpose: Vercel Functions have no
persistent disk, so the graph the `backend` service serves has to ship as
part of the deployment bundle rather than being written to at request time.
Updating the graph means re-running ingest and redeploying — the same
mental model as updating any other static content on the site.
