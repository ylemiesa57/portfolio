// Shared client for chat completions via OpenRouter (https://openrouter.ai).
// Used by the section router and the /api/ask GraphRAG answer step. Replaces
// the local Ollama chat client so answers work wherever this is deployed,
// not just on a machine running `ollama serve`.

export const OPENROUTER_URL =
  process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
// Defaults to a genuinely free OpenRouter model. Swap to a paid model (e.g.
// "qwen/qwen3-30b-a3b") once there are credits on the OpenRouter account —
// this one was picked because it actually returned results with a $0 balance.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

/** Thrown when OpenRouter can't be reached, or no API key is configured. */
export class LLMUnreachableError extends Error {
  constructor(detail?: string) {
    super(
      detail ??
        "The language model isn't reachable. Set OPENROUTER_API_KEY and check network access."
    );
    this.name = "LLMUnreachableError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatComplete(
  messages: ChatMessage[],
  opts?: { format?: "json"; temperature?: number; timeoutMs?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LLMUnreachableError("OPENROUTER_API_KEY is not set.");
  }

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Optional, but OpenRouter uses these for dashboard attribution/rankings.
        "HTTP-Referer": process.env.SITE_URL || "https://github.com/ylemiesa57/portfolio",
        "X-Title": "Yaphet Lemiesa Portfolio",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: opts?.temperature ?? 0.2,
        // Generous ceiling: reasoning-capable free models spend a chunk of
        // their completion budget on hidden reasoning tokens before the
        // visible answer, so a tight limit truncates the actual content.
        max_tokens: 600,
        ...(opts?.format === "json"
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages,
      }),
      // Free-tier models can be slower under load than a paid model would be.
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 45_000),
    });
  } catch {
    throw new LLMUnreachableError();
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter chat failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}
