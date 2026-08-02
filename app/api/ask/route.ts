// GraphRAG answer endpoint. Retrieves a connected subgraph for the question
// (your lib/retrieval.ts), then asks the model to answer grounded in that
// context and returns the answer + citations + the subgraph to render.
//
// Graceful degradation: if retrieval returns nothing (you haven't run ingest
// yet, Neo4j is unreachable, or GEMINI_API_KEY isn't set), it falls back to
// plain section routing so the navigator keeps working.

import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieval";
import { routeToSection } from "@/lib/navigate-llm";
import { chatComplete, LLMUnreachableError } from "@/lib/llm";
import type { RetrievalResult } from "@/lib/graph-types";

const ANSWER_SYSTEM = `You are the assistant for Yaphet Lemiesa's portfolio, speaking on behalf of his whole background — education, work experience, skills, awards, publications, and initiatives, not just his GitHub repos. Answer the visitor's question grounded in the CONTEXT provided below, which is retrieved from his resume and his work. Draw on all of it: if the context includes his experience, education, or skills, use those just as readily as a specific project or repo — don't treat repos as the default and everything else as an afterthought. Be specific and concise (1–3 sentences). Do not invent anything not in the context. If the context genuinely doesn't cover the question, say so briefly rather than guessing. Refer to items by their labels. Reply in plain prose only — no markdown (no **bold**, no bullet points, no headers).`;

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
      if (err instanceof LLMUnreachableError) {
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
      await chatComplete(
        [
          { role: "system", content: ANSWER_SYSTEM },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${query}` },
        ],
        { temperature: 0.2 }
      )
    ).trim();
  } catch (err) {
    if (err instanceof LLMUnreachableError) {
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
