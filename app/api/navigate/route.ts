// "Ask the Blueprint" section router. Takes a visitor's plain-language question
// and asks the model (via OpenRouter) which section of the page best answers
// it. The routing logic lives in lib/navigate-llm.ts so /api/ask can reuse it
// as a fallback.

import { NextRequest, NextResponse } from "next/server";
import { routeToSection } from "@/lib/navigate-llm";
import { LLMUnreachableError, OPENROUTER_MODEL } from "@/lib/llm";

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json(
      { error: "Ask a question to route it." },
      { status: 400 }
    );
  }
  if (query.length > 400) query = query.slice(0, 400);

  try {
    const { section, answer } = await routeToSection(query);
    return NextResponse.json({ section, answer, model: OPENROUTER_MODEL });
  } catch (err) {
    if (err instanceof LLMUnreachableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Model request failed." },
      { status: 502 }
    );
  }
}
