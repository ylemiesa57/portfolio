// Text embeddings via the Gemini API (free tier: 1,500 requests/day, no
// card required as of writing). Replaces the local Ollama embedding client
// so retrieval works at request time wherever this is deployed, not just on
// a machine running `ollama serve`.
//
// output_dimensionality is pinned to 768 to match the existing Neo4j vector
// index (originally sized for nomic-embed-text, also 768-dim). If you ever
// change this, update EMBED_DIM here AND drop/recreate the vector index —
// embeddings from different models/dimensions aren't comparable.

import { LLMUnreachableError } from "./llm";

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
export const EMBED_DIM = 768;

const GEMINI_URL =
  process.env.GEMINI_EMBED_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;

/** Embed a single string into a vector. */
export async function embed(input: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LLMUnreachableError("GEMINI_API_KEY is not set.");
  }

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: input }] },
        output_dimensionality: EMBED_DIM,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new LLMUnreachableError("Couldn't reach the Gemini embeddings API.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini embed failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const vec = data.embedding?.values;
  if (!Array.isArray(vec)) throw new Error("Gemini returned no embedding.");
  return vec;
}

/** Convenience for ingest: embed many strings sequentially (small corpus, keep it simple). */
export async function embedMany(inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const s of inputs) out.push(await embed(s));
  return out;
}
