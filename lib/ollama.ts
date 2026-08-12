// Shared client for the locally-running Ollama server. Used by the section
// router, the /api/ask GraphRAG answer step, and (for embeddings) the ingest
// pipeline + retrieval.

// 127.0.0.1, not "localhost": Node's fetch prefers IPv6 (::1) and Ollama binds
// IPv4 by default, so "localhost" intermittently fails to connect on Windows.
export const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// When Ollama is hosted behind an authenticating reverse proxy (required —
// Ollama itself has no auth), set OLLAMA_TOKEN and the proxy checks it. Empty
// for local dev where Ollama is on loopback.
export const OLLAMA_TOKEN = process.env.OLLAMA_TOKEN || "";

/** Headers for any Ollama request, adding bearer auth when a token is set. */
export function ollamaHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (OLLAMA_TOKEN) headers.Authorization = `Bearer ${OLLAMA_TOKEN}`;
  return headers;
}

/** Thrown when the Ollama server can't be reached at all (vs. an HTTP error). */
export class OllamaUnreachableError extends Error {
  constructor() {
    super(
      "The local model isn't reachable. Start Ollama (`ollama serve`) and pull the models."
    );
    this.name = "OllamaUnreachableError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  messages: ChatMessage[],
  opts?: { format?: "json"; temperature?: number; timeoutMs?: number }
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: ollamaHeaders(),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: opts?.format,
        options: { temperature: opts?.temperature ?? 0.2 },
        messages,
      }),
      // First request after a cold start pays the model-load cost (~25s+).
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 60_000),
    });
  } catch {
    throw new OllamaUnreachableError();
  }
  if (!res.ok) throw new Error(`Ollama chat failed (${res.status}).`);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}
