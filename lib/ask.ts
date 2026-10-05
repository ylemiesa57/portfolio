// The Ask pipeline, factored out of the route so two endpoints can share it:
//
//   - POST /api/ask         returns the finished answer as one JSON object
//                           (the original contract, plus `timings`);
//   - POST /api/ask/stream  emits every stage as it happens (NDJSON), which is
//                           what lets the page narrate the wait honestly
//                           instead of spinning.
//
// Retrieve a connected subgraph for the question (lib/retrieval.ts), then ask
// the model to answer grounded in that context; return answer + citations +
// the subgraph to draw. If retrieval returns nothing (ingest not run, the
// Boltless graph service unreachable, GEMINI_API_KEY unset) it falls back to
// plain section routing so the navigator keeps working -- and says so.

import { retrieve } from "@/lib/retrieval";
import { routeToSection } from "@/lib/navigate-llm";
import { chatComplete, LLMUnreachableError, OPENROUTER_MODEL } from "@/lib/llm";
import { EMBED_MODEL } from "@/lib/embed";
import type { RetrievalResult, GNode, GEdge } from "@/lib/graph-types";
import { sectionForNode } from "@/lib/sections";

export const ASK_K = 5;
export const ASK_HOPS = 1;

const ANSWER_SYSTEM = `You are the assistant for Yaphet Lemiesa's portfolio, speaking on behalf of his whole background — education, work experience, skills, awards, publications, and initiatives, not just his GitHub repos. Answer the visitor's question grounded in the CONTEXT provided below, which is retrieved from his resume and his work. Draw on all of it: if the context includes his experience, education, or skills, use those just as readily as a specific project or repo — don't treat repos as the default and everything else as an afterthought. Be specific and concise (1–3 sentences). Do not invent anything not in the context. If the context genuinely doesn't cover the question, say so briefly rather than guessing. Refer to items by their labels. Reply in plain prose only — no markdown (no **bold**, no bullet points, no headers).`;

export interface Citation {
  id: string;
  label: string;
  type: string;
  sectionId: string;
  url: string | null;
  /** Hybrid relevance score Boltless assigned the seed, when it was a seed. */
  score?: number;
}

export interface AskTimings {
  embedMs?: number;
  retrieveMs?: number;
  generateMs?: number;
  routeMs?: number;
  totalMs: number;
}

export interface AskPayload {
  answer: string;
  section: string;
  subgraph: { nodes: GNode[]; edges: GEdge[] } | null;
  citations: Citation[];
  grounded: boolean;
  timings: AskTimings;
}

export type AskStage = "embed" | "retrieve" | "generate" | "route";

export type AskEvent =
  | {
      event: "stage";
      stage: AskStage;
      status: "start" | "done";
      ms?: number;
      model?: string;
      k?: number;
      hops?: number;
      seeds?: number;
      nodes?: number;
      edges?: number;
    }
  | { event: "warning"; message: string }
  | { event: "result"; payload: AskPayload }
  | { event: "error"; message: string; status: number };

/** Thrown by runAsk so the routes can answer with the right HTTP status. */
export class AskError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AskError";
    this.status = status;
  }
}

export function cleanQuery(raw: unknown): string {
  let query = typeof raw === "string" ? raw.trim() : "";
  if (query.length > 400) query = query.slice(0, 400);
  return query;
}

export async function runAsk(query: string, emit: (e: AskEvent) => void = () => {}): Promise<AskPayload> {
  if (process.env.ASK_MOCK === "1" && process.env.NODE_ENV !== "production") {
    return mockAsk(query, emit);
  }
  const started = Date.now();
  const timings: AskTimings = { totalMs: 0 };

  // Retrieve. Never let a graph/DB problem take down the endpoint — degrade.
  let result: RetrievalResult = { nodes: [], edges: [], seedIds: [] };
  try {
    result = await retrieve(query, {
      k: ASK_K,
      hops: ASK_HOPS,
      onStage: (stage: "embed" | "retrieve", status: "start" | "done", info: Record<string, number | undefined>) => {
        if (stage === "embed" && status === "done") timings.embedMs = info.ms;
        if (stage === "retrieve" && status === "done") timings.retrieveMs = info.ms;
        emit({
          event: "stage",
          stage,
          status,
          ms: info.ms,
          model: stage === "embed" ? EMBED_MODEL : undefined,
          k: ASK_K,
          hops: ASK_HOPS,
          seeds: info.seeds,
          nodes: info.nodes,
          edges: info.edges,
        });
      },
    });
  } catch (err) {
    console.warn("retrieve() failed, falling back to section routing:", err);
    emit({
      event: "warning",
      message:
        err instanceof LLMUnreachableError
          ? "The embeddings API is not reachable, so the graph could not be searched."
          : "The graph service did not answer, so the graph could not be searched.",
    });
  }

  // Fallback path: no graph context available.
  if (!result.nodes.length) {
    emit({ event: "stage", stage: "route", status: "start", model: OPENROUTER_MODEL });
    const t0 = Date.now();
    try {
      const { section, answer } = await routeToSection(query);
      timings.routeMs = Date.now() - t0;
      timings.totalMs = Date.now() - started;
      emit({ event: "stage", stage: "route", status: "done", ms: timings.routeMs, model: OPENROUTER_MODEL });
      const payload: AskPayload = { answer, section, subgraph: null, citations: [], grounded: false, timings };
      emit({ event: "result", payload });
      return payload;
    } catch (err) {
      if (err instanceof LLMUnreachableError) throw new AskError(err.message, 503);
      throw new AskError("Model request failed.", 502);
    }
  }

  // GraphRAG path: answer grounded in the retrieved subgraph.
  const context = result.nodes.map((n) => `[${n.type} · ${n.label}] ${n.text}`).join("\n\n");

  emit({ event: "stage", stage: "generate", status: "start", model: OPENROUTER_MODEL });
  const t0 = Date.now();
  let answer: string;
  try {
    answer = (
      await chatComplete(
        [
          { role: "system", content: ANSWER_SYSTEM },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${query}` },
        ],
        { temperature: 0.2 }
      )
    ).trim();
  } catch (err) {
    if (err instanceof LLMUnreachableError) throw new AskError(err.message, 503);
    throw new AskError("Model request failed.", 502);
  }
  timings.generateMs = Date.now() - t0;
  timings.totalMs = Date.now() - started;
  emit({ event: "stage", stage: "generate", status: "done", ms: timings.generateMs, model: OPENROUTER_MODEL });

  const seeds = result.nodes.filter((n) => result.seedIds.includes(n.id));
  const primary = seeds[0] ?? result.nodes[0];

  const payload: AskPayload = {
    answer: answer || "Here's what I found.",
    section: primary ? sectionForNode(primary) : "hero",
    subgraph: { nodes: result.nodes, edges: result.edges },
    citations: seeds.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      sectionId: sectionForNode(n),
      url: n.url ?? null,
      score: typeof n.score === "number" ? n.score : undefined,
    })),
    grounded: true,
    timings,
  };
  emit({ event: "result", payload });
  return payload;
}

// ---- Local mock -------------------------------------------------------------
// ASK_MOCK=1 (development only) runs the same stages against the real graph
// structure with word overlap instead of embeddings and no model at all, so
// the narrated wait, the lit chart and the failure states can be
// exercised on a machine with no API keys. Every mock answer says it is one.
//   "mock error"  -> the model-unreachable failure
//   "mock route"  -> the graph-out-of-reach fallback

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mockAsk(query: string, emit: (e: AskEvent) => void): Promise<AskPayload> {
  const { getRepos } = await import("@/lib/github");
  const { buildNodesAndEdges, SEEDABLE_TYPES } = await import("@/lib/graph-build");
  const started = Date.now();
  const timings: AskTimings = { totalMs: 0 };
  const q = query.toLowerCase();

  emit({ event: "stage", stage: "embed", status: "start", model: "mock (ASK_MOCK=1)" });
  await sleep(450);
  timings.embedMs = 450;
  emit({ event: "stage", stage: "embed", status: "done", ms: 450, model: "mock (ASK_MOCK=1)" });

  if (q.includes("mock route")) {
    emit({ event: "warning", message: "Mock: the graph service did not answer, so the graph could not be searched." });
    emit({ event: "stage", stage: "route", status: "start", model: "mock (ASK_MOCK=1)" });
    await sleep(900);
    timings.routeMs = 900;
    timings.totalMs = Date.now() - started;
    emit({ event: "stage", stage: "route", status: "done", ms: 900, model: "mock (ASK_MOCK=1)" });
    const payload: AskPayload = {
      answer: "Local mock, no model ran: this is what a page-routed answer looks like when the graph is unreachable.",
      section: "publications",
      subgraph: null,
      citations: [],
      grounded: false,
      timings,
    };
    emit({ event: "result", payload });
    return payload;
  }

  emit({ event: "stage", stage: "retrieve", status: "start", k: ASK_K, hops: ASK_HOPS });
  const { nodes, edges } = buildNodesAndEdges(await getRepos());
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = nodes
    .filter((n) => SEEDABLE_TYPES.has(n.type))
    .map((n) => {
      const t = (n.label + " " + n.text).toLowerCase();
      const hits = words.filter((w) => t.includes(w)).length;
      return { n, score: hits / Math.max(1, words.length) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, ASK_K);
  const seedIds = scored.map((s) => s.n.id);
  const lit = new Set(seedIds);
  for (const e of edges) {
    if (lit.has(e.src)) lit.add(e.dst);
    else if (lit.has(e.dst)) lit.add(e.src);
  }
  // Boltless returns the top_n (14) by hybrid score; mirror that cap so the
  // lit set looks like a real one: seeds first, then their neighbours.
  const ordered = [...seedIds, ...[...lit].filter((id) => !seedIds.includes(id))].slice(0, 14);
  const keep = new Set(ordered);
  const subNodes: GNode[] = nodes
    .filter((n) => keep.has(n.id))
    .map((n) => ({ ...n, score: scored.find((s) => s.n.id === n.id)?.score }));
  const subEdges: GEdge[] = edges.filter((e) => keep.has(e.src) && keep.has(e.dst));
  await sleep(200);
  timings.retrieveMs = 200;
  emit({
    event: "stage",
    stage: "retrieve",
    status: "done",
    ms: 200,
    k: ASK_K,
    hops: ASK_HOPS,
    seeds: seedIds.length,
    nodes: subNodes.length,
    edges: subEdges.length,
  });

  emit({ event: "stage", stage: "generate", status: "start", model: "mock (ASK_MOCK=1)" });
  await sleep(1400);
  if (q.includes("mock error")) throw new AskError("Mock: the language model isn't reachable.", 503);
  timings.generateMs = 1400;
  timings.totalMs = Date.now() - started;
  emit({ event: "stage", stage: "generate", status: "done", ms: 1400, model: "mock (ASK_MOCK=1)" });

  const seeds = scored.map((s) => s.n);
  const payload: AskPayload = {
    answer:
      seeds.length === 0
        ? "Local mock, no model ran: nothing in the graph shares a word with that question."
        : `Local mock, no model ran: by word overlap the closest things in the graph are ${seeds
            .map((n) => n.label)
            .join(", ")}.`,
    section: seeds[0]?.sectionId ?? "hero",
    subgraph: { nodes: subNodes, edges: subEdges },
    citations: seeds.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      sectionId: n.sectionId,
      url: n.url ?? null,
      score: scored.find((s) => s.n.id === n.id)?.score,
    })),
    grounded: true,
    timings,
  };
  emit({ event: "result", payload });
  return payload;
}
