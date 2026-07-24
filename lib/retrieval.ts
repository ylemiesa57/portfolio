/**
 * ⟢ Retrieval-layer file (your ownership area) — GraphRAG retrieval.
 *
 * Implements the `Retrieve` contract from graph-types.ts. /api/ask calls this
 * and knows nothing about Neo4j — as long as it gets { nodes, edges, seedIds }
 * back, the API and viz just work.
 *
 *   1. embed the query
 *   2. vector-search top-k seed nodes   (db.index.vector.queryNodes)
 *   3. traverse `hops` from the seeds    (variable-length MATCH)
 *   4. return the deduped subgraph        (nodes + edges among them + seedIds)
 *
 * If the graph/DB is unavailable this throws; /api/ask catches it and falls
 * back to plain section routing so the site keeps working.
 */

import neo4j from "neo4j-driver";
import { embed } from "./embed";
import { runRead, VECTOR_INDEX, ENTITY_LABEL } from "./graph";
import type { Retrieve, GNode, GEdge } from "./graph-types";

// Keep the LLM context (and the viz) manageable regardless of fan-out.
const MAX_NODES = 14;

interface NodeRow {
  id: string;
  type: GNode["type"];
  label: string;
  sectionId: string;
  text: string;
  url: string | null;
  score?: number;
}

function toNode(r: NodeRow): GNode {
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    sectionId: r.sectionId,
    text: r.text,
    url: r.url ?? undefined,
    ...(typeof r.score === "number" ? { score: r.score } : {}),
  };
}

export const retrieve: Retrieve = async (query, opts) => {
  const k = Math.max(1, Math.floor(opts?.k ?? 5));
  const hops = Math.max(1, Math.min(3, Math.floor(opts?.hops ?? 1)));

  // 1. Embed the query.
  const qvec = await embed(query);

  // 2. Vector search for seeds. queryNodes needs an INTEGER for k, hence int().
  const seedRows = await runRead<NodeRow>(
    `CALL db.index.vector.queryNodes($index, $k, $qvec)
     YIELD node, score
     RETURN node.id AS id, node.type AS type, node.label AS label,
            node.sectionId AS sectionId, node.text AS text, node.url AS url,
            score`,
    { index: VECTOR_INDEX, k: neo4j.int(k), qvec }
  );

  // Dedupe by id, seeds first (so their score is kept).
  const byId = new Map<string, GNode>();
  const seedIds: string[] = [];
  for (const row of seedRows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, toNode(row));
      seedIds.push(row.id);
    }
  }

  // 3. Expand `hops` from the seeds to pull connected context. `hops` is a
  //    clamped integer, safe to inline (Cypher can't parameterize a range bound).
  if (seedIds.length) {
    const nbrRows = await runRead<NodeRow>(
      `MATCH (seed:${ENTITY_LABEL}) WHERE seed.id IN $seedIds
       MATCH (seed)-[:REL*1..${hops}]-(nbr:${ENTITY_LABEL})
       RETURN DISTINCT nbr.id AS id, nbr.type AS type, nbr.label AS label,
              nbr.sectionId AS sectionId, nbr.text AS text, nbr.url AS url`,
      { seedIds }
    );
    for (const row of nbrRows) {
      if (byId.size >= MAX_NODES) break;
      if (!byId.has(row.id)) byId.set(row.id, toNode(row));
    }
  }

  const nodes = [...byId.values()];
  const ids = [...byId.keys()];

  // 4. Edges among the returned nodes only (directed, returned once each).
  let edges: GEdge[] = [];
  if (ids.length) {
    const edgeRows = await runRead<GEdge>(
      `MATCH (a:${ENTITY_LABEL})-[r:REL]->(b:${ENTITY_LABEL})
       WHERE a.id IN $ids AND b.id IN $ids
       RETURN a.id AS src, r.rel AS rel, b.id AS dst`,
      { ids }
    );
    edges = edgeRows.map((e) => ({ src: e.src, rel: e.rel, dst: e.dst }));
  }

  return { nodes, edges, seedIds };
};
