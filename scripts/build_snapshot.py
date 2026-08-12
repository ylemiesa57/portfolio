#!/usr/bin/env python3
"""Build a Boltless GraphDB snapshot from the JSON graph dump produced by
scripts/ingest.ts, and write it into backend/graph_data/.

Split this way on purpose: ingest.ts owns *what* the graph contains (GitHub
repos, resume content, embeddings via Gemini — all TypeScript, unchanged from
before the Boltless migration). This script owns *how* it's stored — turning
that content into a Boltless-native snapshot. Neither side needs to know the
other's language.

Usage:
    python3 scripts/build_snapshot.py graph-data/graph.json backend/graph_data

Requires the `boltless` package (same version pinned in
backend/requirements.txt):

    pip install "boltless @ git+https://github.com/ylemiesa57/boltless.git@v0.1.0"

Input JSON shape (matches lib/graph-types.ts's GNode/GEdge, plus an
`embedding` array per node):

    {
      "nodes": [
        {"id": "person:yaphet", "type": "Person", "label": "Yaphet Lemiesa",
         "sectionId": "hero", "text": "...", "url": null,
         "embedding": [0.01, -0.03, ...]},
        ...
      ],
      "edges": [
        {"src": "person:yaphet", "rel": "AUTHORED", "dst": "repo:boltless"},
        ...
      ]
    }
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

try:
    from boltless import GraphDB
except ImportError:
    print(
        "error: the `boltless` package isn't installed.\n"
        "  pip install \"boltless @ git+https://github.com/ylemiesa57/boltless.git@v0.1.0\"",
        file=sys.stderr,
    )
    raise SystemExit(1)


def build(input_path: Path, output_dir: Path) -> None:
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    if not nodes:
        raise SystemExit(f"error: {input_path} has no nodes")

    # Build into a fresh, empty temp directory rather than output_dir
    # directly. ingest.ts always emits the *complete* current graph, not a
    # delta — if we opened output_dir in place, GraphDB would load whatever
    # snapshot was already there and merge into it, so a node removed from
    # this run's JSON (a deleted repo, a renamed award) would linger forever
    # instead of disappearing. Building fresh and atomically replacing the
    # served files makes each run a clean rebuild.
    #
    # The temp dir is created as a *sibling* of output_dir (not the OS
    # default, often a different filesystem/mount) so the final os.replace
    # is a same-device atomic rename rather than a cross-device copy that
    # could fail or leave a half-written file on interruption.
    output_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = Path(tempfile.mkdtemp(prefix=".build-", dir=output_dir.parent))
    try:
        db = GraphDB(str(tmp_path))
        g = db.graph

        n_embedded = 0
        for node in nodes:
            g.add_node(
                node["id"],
                node["type"],
                name=node["label"],
                sectionId=node["sectionId"],
                text=node.get("text", ""),
                url=node.get("url"),
            )
            embedding = node.get("embedding")
            if embedding:
                g.set_embedding(node["id"], embedding)
                n_embedded += 1

        for edge in edges:
            g.add_edge(edge["src"], edge["dst"], edge["rel"])

        db.snapshot()
        db.close()

        os.replace(tmp_path / "snapshot.bolt", output_dir / "snapshot.bolt")
        os.replace(tmp_path / "wal.bolt", output_dir / "wal.bolt")

        print(
            f"wrote {output_dir}: {g.num_nodes} nodes ({n_embedded} embedded), "
            f"{g.num_edges} edges"
        )
    finally:
        shutil.rmtree(tmp_path, ignore_errors=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <input.json> <output_dir>", file=sys.stderr)
        raise SystemExit(2)
    build(Path(sys.argv[1]), Path(sys.argv[2]))
