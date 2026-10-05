// GraphRAG answer endpoint (JSON). The pipeline lives in lib/ask.ts; this
// route keeps the original one-shot contract: retrieve a subgraph, answer
// grounded in it, return answer + citations + subgraph, falling back to
// section routing when the graph is out of reach. /api/ask/stream serves the
// same pipeline as events for the page's narrated wait.

import { NextRequest, NextResponse } from "next/server";
import { AskError, cleanQuery, runAsk } from "@/lib/ask";

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = cleanQuery(body?.query);
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  try {
    const payload = await runAsk(query);
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof AskError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Model request failed." }, { status: 502 });
  }
}
