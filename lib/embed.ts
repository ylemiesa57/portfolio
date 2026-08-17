// Text embeddings via the Gemini API (free tier: 1,500 requests/day, no
// card required as of writing). Replaces the local Ollama embedding client
// so retrieval works at request time wherever this is deployed, not just on
// a machine running `ollama serve`.
//
// output_dimensionality is pinned to 768 (originally sized for
// nomic-embed-text, also 768-dim). If you ever change this, update EMBED_DIM
// here and re-run `npm run ingest` — embeddings from different
// models/dimensions aren't comparable, and Boltless rebuilds its HNSW index
// from the new snapshot on the next graph-service cold start.

import { LLMUnreachableError } from "./llm";

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
export const EMBED_DIM = 768;

const GEMINI_URL =
  process.env.GEMINI_EMBED_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;

/**
 * Gemini's embedding model is asymmetric-retrieval aware: it expects the
 * *query* side and the *document* side of a search to be embedded with
 * different taskTypes. Omitting taskType (the previous behaviour) gets you a
 * generic symmetric embedding, which measurably mis-ranks retrieval here --
 * e.g. "What has he published?" scored the boilerplate "SYSTEMS -- a domain of
 * Yaphet's work" node above the actual Paper nodes. Pass RETRIEVAL_DOCUMENT at
 * ingest time and RETRIEVAL_QUERY at request time.
 */
export type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

/** Embed a single string into a vector. */
export async function embed(input: string, taskType?: EmbedTaskType): Promise<number[]> {
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
        ...(taskType ? { taskType } : {}),
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
export async function embedMany(
  inputs: string[],
  taskType?: EmbedTaskType
): Promise<number[][]> {
  const out: number[][] = [];
  for (const s of inputs) out.push(await embed(s, taskType));
  return out;
}
