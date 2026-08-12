"""Boltless-backed retrieval service for the portfolio's GraphRAG endpoint.

Deployed as a Vercel Service alongside the Next.js frontend (see
../vercel.json) and reachable only over a private service binding — there is
no public rewrite to this service, so it is never internet-routable on its
own. The frontend's lib/graph.ts calls it via the BOLTLESS_URL environment
variable Vercel injects for the binding.

Design notes:

- The graph is a build-time artifact: `graph_data/snapshot.bolt` is produced
  offline by `scripts/ingest.ts` + `scripts/build_snapshot.py` and committed
  to the repo, not written to at request time. Vercel Functions don't offer a
  persistent disk, so there is no live-write path here by design — updating
  the portfolio's graph means re-running ingest and redeploying, the same way
  updating any other static content on the site does.
- On cold start, the bundled (read-only) graph_data/ is copied into /tmp
  (writable) before GraphDB opens it, because GraphDB always opens wal.bolt
  for append even if nothing is ever appended in this process. The retriever
  and HNSW index are then cached at module scope so warm invocations reuse
  them — for a graph this size (tens to low hundreds of nodes), the whole
  cold-start path (copy + snapshot load + HNSW build) takes low
  milliseconds, per Boltless's own benchmarks at this scale.
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from boltless import GraphDB, Retriever

app = FastAPI(title="portfolio-boltless")

_BUNDLED_GRAPH_DATA = Path(__file__).resolve().parent / "graph_data"

_state: dict[str, Any] = {}


def _load() -> tuple[Retriever, Any]:
    """Load (once per cold start) the bundled snapshot into a writable tmp
    dir, build the HNSW index, and cache both for warm reuse."""
    if "retriever" in _state:
        return _state["retriever"], _state["graph"]

    if not any(_BUNDLED_GRAPH_DATA.glob("snapshot.bolt")):
        raise RuntimeError(
            "No graph_data/snapshot.bolt bundled with this service. Run "
            "`npm run ingest` (which invokes scripts/build_snapshot.py) and "
            "redeploy."
        )

    tmp = Path(tempfile.mkdtemp(prefix="boltless-"))
    shutil.copytree(_BUNDLED_GRAPH_DATA, tmp, dirs_exist_ok=True)

    db = GraphDB(str(tmp))
    retriever = Retriever(db.graph)
    retriever.build_index()

    _state["db"] = db
    _state["retriever"] = retriever
    _state["graph"] = db.graph
    return retriever, db.graph


class RetrieveRequest(BaseModel):
    embedding: list[float] = Field(..., min_length=1)
    k: int = Field(5, ge=1, le=50)
    hops: int = Field(1, ge=1, le=3)
    top_n: int = Field(20, ge=1, le=100)
    alpha: float = Field(0.6, ge=0.0, le=1.0)
    beta: float = Field(0.35, ge=0.0, le=1.0)


@app.get("/health")
def health() -> dict:
    try:
        _, g = _load()
    except RuntimeError as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True, "nodes": g.num_nodes, "edges": g.num_edges}


@app.post("/retrieve")
def retrieve(req: RetrieveRequest) -> dict:
    try:
        retriever, g = _load()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if g.num_nodes == 0:
        return {"nodes": [], "edges": [], "seedIds": []}

    result = retriever.retrieve(
        req.embedding,
        k_seeds=req.k,
        hops=req.hops,
        top_n=req.top_n,
        alpha=req.alpha,
        beta=req.beta,
    )
    return result.to_dict(g)
