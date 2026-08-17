/**
 * Build-time README ingestion for the Projects section.
 *
 * The project cards show "what it is / the tradeoff / what I learned" pulled
 * from each repo's README, so the site can't drift from the code the way a
 * hand-maintained copy would. Two things make that harder than it sounds:
 *
 *  1. READMEs here don't share a heading vocabulary. One calls a section
 *     "Scope and limitations", another "Status", another has no headings at
 *     all. So sections are matched on a set of aliases per slot, not on one
 *     canonical title.
 *  2. Several READMEs are genuinely thin (riscv-simd-core is ~226 words with
 *     no decision content). Rather than render an empty panel, every slot
 *     falls back: matched section -> lead paragraph -> GitHub description.
 *
 * Everything here runs at build/revalidate time on the server. Nothing is
 * fetched in the browser.
 */

import { GithubRepo } from "./github";

export interface ProjectReadme {
  /** Short lead: what the project actually is. */
  summary: string;
  /** Design decisions, tradeoffs, or explicit scope limits, if documented. */
  tradeoffs?: string;
  /** Results, findings, or status, if documented. */
  findings?: string;
  /** True when we found real prose beyond the fallback description. */
  hasDepth: boolean;
}

/** Heading aliases per slot, matched case-insensitively against `## Heading`. */
const SECTION_ALIASES: Record<"tradeoffs" | "findings", string[]> = {
  tradeoffs: [
    "scope and limitations",
    "limitations",
    "tradeoffs",
    "trade-offs",
    "design decisions",
    "why",
    "known issues",
    "caveats",
    "status",
  ],
  findings: [
    "results",
    "findings",
    "benchmarks",
    "what's inside",
    "what this is",
    "highlights",
    "architecture",
    "analysis",
  ],
};

/** Strip markdown down to readable prose for a card. */
function toProse(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")           // fenced code
    .replace(/^\s*\|.*\|\s*$/gm, " ")          // table rows
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")     // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")   // links -> text
    .replace(/^[>#\-*+]\s*/gm, "")             // block markers
    .replace(/[*_`]/g, "")                     // inline emphasis
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return (stop > max * 0.5 ? cut.slice(0, stop + 1) : cut.trimEnd() + "…").trim();
}

/** Split a README into `## heading` -> body. */
function sections(md: string): { title: string; body: string }[] {
  const out: { title: string; body: string }[] = [];
  const lines = md.split("\n");
  let title = "";
  let buf: string[] = [];
  for (const line of lines) {
    const m = /^#{2,3}\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (title || buf.length) out.push({ title, body: buf.join("\n") });
      title = m[1];
      buf = [];
    } else {
      buf.push(line);
    }
  }
  if (title || buf.length) out.push({ title, body: buf.join("\n") });
  return out;
}

function pick(secs: { title: string; body: string }[], aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const hit = secs.find((s) => s.title.toLowerCase().includes(alias));
    if (hit) {
      const prose = toProse(hit.body);
      if (prose.length > 60) return clamp(prose, 420);
    }
  }
  return undefined;
}

/** Lead paragraph: the prose before the first `##`, minus badges and the H1. */
function lead(md: string): string {
  const secs = sections(md);
  const head = secs[0]?.title ? "" : secs[0]?.body ?? "";
  const body = head || md.split(/^#{2,3}\s+/m)[0] || "";
  return clamp(toProse(body.replace(/^#\s+.*$/m, "")), 340);
}

export function parseReadme(markdown: string | null, repo: GithubRepo): ProjectReadme {
  const fallback = repo.description?.trim() || "No description yet.";
  if (!markdown) return { summary: fallback, hasDepth: false };

  const secs = sections(markdown);
  const summary = lead(markdown) || fallback;
  const tradeoffs = pick(secs, SECTION_ALIASES.tradeoffs);
  const findings = pick(secs, SECTION_ALIASES.findings);

  return {
    summary: summary.length > 40 ? summary : fallback,
    tradeoffs,
    findings,
    hasDepth: Boolean(tradeoffs || findings) && summary.length > 80,
  };
}
