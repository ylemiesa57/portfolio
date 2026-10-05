// The Ask pipeline as newline-delimited JSON events, one per line:
//
//   {"event":"stage","stage":"embed","status":"start",...}
//   {"event":"stage","stage":"retrieve","status":"done","ms":94,"seeds":5,...}
//   {"event":"warning","message":"..."}          (a stage fell back)
//   {"event":"result","payload":{...}}           (same shape as POST /api/ask)
//   {"event":"error","message":"...","status":503}
//
// The Ask panel reads this to narrate the wait with what is
// actually happening and how long each stage took, rather than a spinner.

import { NextRequest } from "next/server";
import { AskError, cleanQuery, runAsk, type AskEvent } from "@/lib/ask";

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = cleanQuery(body?.query);
  } catch {
    return new Response(JSON.stringify({ event: "error", message: "Malformed request.", status: 400 }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }
  if (!query) {
    return new Response(JSON.stringify({ event: "error", message: "Ask a question.", status: 400 }) + "\n", {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AskEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runAsk(query, send);
      } catch (err) {
        if (err instanceof AskError) send({ event: "error", message: err.message, status: err.status });
        else send({ event: "error", message: "Model request failed.", status: 502 });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
