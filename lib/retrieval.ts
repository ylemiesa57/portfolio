/**
 * ⟢ Retrieval-layer file (your ownership area) — GraphRAG retrieval.
 *
 * Implements the `Retrieve` contract from graph-types.ts. /api/ask calls this
 * and knows nothing about Boltless — as long as it gets { nodes, edges,
 * seedIds } back, the API and viz just work.
 *
 *   1. embed the query (Gemini)
 *   2. call the Boltless backend service's /retrieve — HNSW seeds, bounded
 *      k-hop expansion, and hybrid cosine + personalized-PageRank scoring
 *      all happen server-side, in Boltless's Retriever
 *   3. map the generic {key, label, props} response into GNode/GEdge
 *
 * If the graph service is unavailable this throws; /api/ask catches it and
 * falls back to plain section routing so the site keeps working.
 */

import { embed } from "./embed";
import { boltlessRetrieve, type BoltlessEdge, type BoltlessNode } from "./graph";
import type { Retrieve, GEdge, GNode } from "./graph-types";

// Keep the LLM context (and the viz) manageable regardless of fan-out. This
// used to be enforced by hand in this file; now it's the `top_n` Boltless is
// asked for directly, since Boltless returns nodes already ranked by hybrid
// relevance score instead of an unordered hop-expansion set.
const TOP_N = 14;

function toGNode(n: BoltlessNode): GNode {
  const props = n.props ?? {};
  return {
    id: n.key,
    type: n.label as GNode["type"],
    label: (props.name as string) ?? n.key,
    sectionId: (props.sectionId as string) ?? "hero",
    text: (props.text as string) ?? "",
    url: (props.url as string | null) ?? undefined,
    score: n.score,
  };
}

export const retrieve: Retrieve = async (query, opts) => {
  const k = Math.max(1, Math.floor(opts?.k ?? 5));
  const hops = Math.max(1, Math.min(3, Math.floor(opts?.hops ?? 1)));

  // 1. Embed the query.
  const qvec = await embed(query);

  // 2. Hybrid vector + graph retrieval, scored server-side by Boltless.
  const result = await boltlessRetrieve(qvec, { k, hops, topN: TOP_N });

  // 3. Map the generic response onto the portfolio's GNode/GEdge shape.
  const nodes: GNode[] = result.nodes.map(toGNode);
  const edges: GEdge[] = result.edges.map((e: BoltlessEdge) => ({
    src: e.src,
    rel: e.type,
    dst: e.dst,
  }));

  return { nodes, edges, seedIds: result.seedIds };
};
