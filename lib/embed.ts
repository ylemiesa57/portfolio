// Local text embeddings via Ollama. Default model is nomic-embed-text
// (768-dim); if you swap models, update EMBED_DIM and the Neo4j vector index
// dimension to match.

import { OLLAMA_URL, OllamaUnreachableError } from "./ollama";

export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
export const EMBED_DIM = 768; // nomic-embed-text output dimension

/** Embed a single string into a vector. Pull the model first: `ollama pull nomic-embed-text`. */
export async function embed(input: string): Promise<number[]> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new OllamaUnreachableError();
  }
  if (!res.ok) throw new Error(`Ollama embed failed (${res.status}).`);
  const data = (await res.json()) as { embeddings?: number[][] };
  const vec = data.embeddings?.[0];
  if (!Array.isArray(vec)) throw new Error("Ollama returned no embedding.");
  return vec;
}

/** Convenience for ingest: embed many strings sequentially (small corpus, keep it simple). */
export async function embedMany(inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const s of inputs) out.push(await embed(s));
  return out;
}
