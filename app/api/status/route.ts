// Health of the pieces behind Ask, for the status line under the Ask field. Reports
// facts the server can check cheaply: whether the graph service answers and
// how big its graph is, whether the embedding and chat keys are configured,
// and which chat model is in use. It never calls the paid APIs.

import { NextResponse } from "next/server";
import { boltlessHealth } from "@/lib/graph";
import { OPENROUTER_MODEL } from "@/lib/llm";
import { EMBED_MODEL } from "@/lib/embed";

export const dynamic = "force-dynamic";

export interface StatusPayload {
  graph: { ok: boolean; nodes?: number; edges?: number; error?: string };
  embeddings: { configured: boolean; model: string };
  model: { configured: boolean; name: string; freeTier: boolean };
  checkedAt: string;
}

export async function GET() {
  let graph: StatusPayload["graph"];
  try {
    const h = await boltlessHealth();
    graph = h.ok ? { ok: true, nodes: h.nodes, edges: h.edges } : { ok: false, error: h.error };
  } catch (err) {
    graph = { ok: false, error: err instanceof Error ? err.message : "unreachable" };
  }

  const payload: StatusPayload = {
    graph,
    embeddings: { configured: Boolean(process.env.GEMINI_API_KEY), model: EMBED_MODEL },
    model: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      name: OPENROUTER_MODEL,
      freeTier: OPENROUTER_MODEL.endsWith(":free"),
    },
    checkedAt: new Date().toISOString(),
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
