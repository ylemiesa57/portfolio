// The contract between the retrieval layer (yours: ingest.ts + retrieval.ts)
// and the app layer (mine: /api/ask + the viz). Both sides import ONLY from
// here, so you can change how the graph is built/queried without touching the
// API or UI, as long as retrieve() keeps returning this shape.

export type GNodeType =
  | "Person"
  | "Repo"
  | "Paper"
  | "Award"
  | "Initiative"
  | "Org"
  | "Topic"
  | "Domain"
  | "Language";

export interface GNode {
  /** Stable unique id, e.g. "repo:EmbraceAI", "paper:ai-small-noisy-data". */
  id: string;
  type: GNodeType;
  /** Human-readable name shown in the graph and citations. */
  label: string;
  /** Which page section to scroll to when this node is clicked (a lib/sections.ts id). */
  sectionId: string;
  /** The text that was embedded and is shown to the LLM as context. */
  text: string;
  /** Optional external link (repo/paper/org URL). */
  url?: string;
  /** Similarity score for seed nodes; set by retrieval, ignored on ingest. */
  score?: number;
}

export interface GEdge {
  /** GNode.id of the source. */
  src: string;
  /** Relationship type, e.g. "AUTHORED", "CONTRIBUTED_TO", "USES", "IN_DOMAIN". */
  rel: string;
  /** GNode.id of the target. */
  dst: string;
}

export interface RetrievalResult {
  /** Seeds (vector hits) + their traversed neighbors, deduped by id. */
  nodes: GNode[];
  /** Edges among the returned nodes (both endpoints present in `nodes`). */
  edges: GEdge[];
  /** ids of the vector-search hits — the nodes that directly matched the query. */
  seedIds: string[];
}

/**
 * The seam. retrieval.ts implements this; /api/ask consumes it.
 * @param k    how many vector seeds to fetch (default 5)
 * @param hops how many relationship hops to expand from each seed (default 1)
 */
export type Retrieve = (
  query: string,
  opts?: { k?: number; hops?: number }
) => Promise<RetrievalResult>;
