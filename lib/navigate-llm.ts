// Section routing: given a visitor's question, ask the model which section
// of the page best answers it. This is the pre-graph behavior and now also
// the fallback for /api/ask when the knowledge graph hasn't been ingested
// yet (or the graph/embeddings/DB aren't reachable), so the navigator keeps
// working regardless.

import { SECTIONS, SECTION_IDS } from "./sections";
import { chatComplete } from "./llm";

function catalog(): string {
  return SECTIONS.map((s) => `- id "${s.id}" (${s.label}): ${s.keywords}`).join(
    "\n"
  );
}

const SYSTEM_PROMPT = `You are the navigator for Yaphet Lemiesa's portfolio site, styled as an engineering "working drawing". A visitor asks a question; you decide which section best answers it and reply.

Sections:
${catalog()}

Rules:
- Pick the single best section id from this exact set: ${SECTION_IDS.join(", ")}.
- "answer" is one or two short, specific sentences telling the visitor what they'll find there. Never invent facts.
- If the question is unrelated to this person or page, use "hero" and say you can only help navigate Yaphet's work.
- Respond with ONLY a JSON object: {"section": "<id>", "answer": "<text>"}`;

export interface RouteResult {
  section: string;
  answer: string;
}

export async function routeToSection(query: string): Promise<RouteResult> {
  const raw = await chatComplete(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
    { format: "json", temperature: 0.2 }
  );

  let section = "hero";
  let answer = "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.section === "string" && SECTION_IDS.includes(parsed.section)) {
      section = parsed.section;
    }
    if (typeof parsed.answer === "string") answer = parsed.answer.trim();
  } catch {
    answer = raw.trim();
  }
  if (!answer) answer = "Here's the closest part of the sheet.";
  return { section, answer };
}
