// Boltless HTTP client (server-only). The graph engine — a Boltless-backed
// FastAPI service, see /backend — runs as a separate Vercel Service in this
// same project (see vercel.json) and is reachable only over a private
// service binding: Vercel injects BOLTLESS_URL at runtime, and there is no
// public route to this service at all. Locally, run the backend yourself
// (see backend/README.md) and BOLTLESS_URL falls back to localhost.
//
// This file replaces the old neo4j-driver singleton. lib/retrieval.ts is the
// only caller; nothing else should import this directly.

const BASE_URL = process.env.BOLTLESS_URL || "http://localhost:8000";

export interface BoltlessNode {
  id: number;
  key: string;
  /** The Boltless graph label — set to the GNode's `type` at ingest time. */
  label: string;
  score: number;
  props: Record<string, unknown>;
}

export interface BoltlessEdge {
  src: string;
  dst: string;
  type: string;
}

export interface BoltlessRetrieveResponse {
  nodes: BoltlessNode[];
  edges: BoltlessEdge[];
  seedIds: string[];
}

export interface BoltlessRetrieveOptions {
  k?: number;
  hops?: number;
  topN?: number;
  alpha?: number;
  beta?: number;
}

/**
 * POST /retrieve on the Boltless backend service. Throws on any non-2xx
 * response or network failure — the caller (lib/retrieval.ts) decides how to
 * degrade (see /api/ask/route.ts's fallback to section routing).
 */
export async function boltlessRetrieve(
  embedding: number[],
  opts: BoltlessRetrieveOptions = {}
): Promise<BoltlessRetrieveResponse> {
  let res: Response;
  try {
    res = await fetch(new URL("/retrieve", BASE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embedding,
        k: opts.k ?? 5,
        hops: opts.hops ?? 1,
        top_n: opts.topN ?? 14,
        ...(opts.alpha !== undefined ? { alpha: opts.alpha } : {}),
        ...(opts.beta !== undefined ? { beta: opts.beta } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new Error(
      `Couldn't reach the Boltless backend at ${BASE_URL}: ${err instanceof Error ? err.message : err}`
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`boltless /retrieve failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as BoltlessRetrieveResponse;
}

/** GET /health on the Boltless backend service. Diagnostics only. */
export async function boltlessHealth(): Promise<{
  ok: boolean;
  nodes?: number;
  edges?: number;
  error?: string;
}> {
  const res = await fetch(new URL("/health", BASE_URL), {
    signal: AbortSignal.timeout(5_000),
  });
  return (await res.json()) as { ok: boolean; nodes?: number; edges?: number; error?: string };
}
