// GraphRAG answer endpoint. Retrieves a connected subgraph for the question
// (your lib/retrieval.ts), then asks the local model to answer grounded in that
// context and returns the answer + citations + the subgraph to render.
//
// Graceful degradation: if retrieval returns nothing (you haven't run ingest
// yet, or Neo4j is down), it falls back to plain section routing so the
// navigator keeps working throughout the infra build.

import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieval";
import { routeToSection } from "@/lib/navigate-llm";
import { ollamaChat, OllamaUnreachableError } from "@/lib/ollama";
import type { RetrievalResult } from "@/lib/graph-types";

const ANSWER_SYSTEM = `You are the assistant for Yaphet Lemiesa's portfolio. Answer the visitor's question using ONLY the CONTEXT provided — a set of items retrieved from his work. Be specific and concise (1–3 sentences). Do not invent anything not in the context. If the context doesn't cover it, say so briefly. Refer to items by their labels.`;

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }
  if (query.length > 400) query = query.slice(0, 400);

  // Retrieve. Never let a graph/DB problem take down the endpoint — degrade.
  let result: RetrievalResult = { nodes: [], edges: [], seedIds: [] };
  try {
    result = await retrieve(query, { k: 5, hops: 1 });
  } catch (err) {
    console.warn("retrieve() failed, falling back to section routing:", err);
  }

  // Fallback path: no graph context available.
  if (!result.nodes.length) {
    try {
      const { section, answer } = await routeToSection(query);
      return NextResponse.json({
        answer,
        section,
        subgraph: null,
        citations: [],
        grounded: false,
      });
    } catch (err) {
      if (err instanceof OllamaUnreachableError) {
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      return NextResponse.json({ error: "Model request failed." }, { status: 502 });
    }
  }

  // GraphRAG path: answer grounded in the retrieved subgraph.
  const context = result.nodes
    .map((n) => `[${n.type} · ${n.label}] ${n.text}`)
    .join("\n\n");

  let answer: string;
  try {
    answer = (
      await ollamaChat(
        [
          { role: "system", content: ANSWER_SYSTEM },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${query}` },
        ],
        { temperature: 0.2 }
      )
    ).trim();
  } catch (err) {
    if (err instanceof OllamaUnreachableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Model request failed." }, { status: 502 });
  }

  const seeds = result.nodes.filter((n) => result.seedIds.includes(n.id));
  const primary = seeds[0] ?? result.nodes[0];

  return NextResponse.json({
    answer: answer || "Here's what I found.",
    section: primary?.sectionId ?? "hero",
    subgraph: { nodes: result.nodes, edges: result.edges },
    citations: seeds.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      sectionId: n.sectionId,
      url: n.url ?? null,
    })),
    grounded: true,
  });
}
