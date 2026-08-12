/**
 * ⟢ Retrieval-layer file (your ownership area) — the ETL pipeline.
 *
 * Pulls repos (lib/github.ts) + static content (lib/content.ts), turns them
 * into graph nodes/edges, embeds each node via the Gemini API, and writes
 * everything into a Boltless GraphDB snapshot via scripts/build_snapshot.py.
 * Not incremental: every run emits the complete current graph and
 * build_snapshot.py does a clean rebuild, so a node removed from this run's
 * output (a deleted repo, a renamed award) doesn't linger. Re-run any time
 * (`npm run ingest`).
 *
 * Prereqs (see KNOWLEDGE_GRAPH.md):
 *   - `boltless` installed: pip install -r backend/requirements.txt
 *   - Embed model pulled:  set GEMINI_API_KEY (see .env.example)
 */

// Relative imports (not the "@/" alias): this runs under tsx, whose esbuild
// resolver ignores tsconfig `paths`.
import { getRepos, classifyDomain, DOMAIN_LABEL } from "../lib/github";
import {
  awards,
  education,
  experience,
  initiatives,
  ossContributions,
  publications,
} from "../lib/content";
import { embed } from "../lib/embed";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GNode, GEdge } from "../lib/graph-types";

const PERSON_ID = "person:yaphet";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// ---- Build the graph from content -------------------------------------------

async function buildNodesAndEdges(): Promise<{ nodes: GNode[]; edges: GEdge[] }> {
  const repos = await getRepos();

  // Dedupe every node by id (a Domain/Language/Org is referenced many times).
  const nodeMap = new Map<string, GNode>();
  const add = (n: GNode) => {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  };

  // Dedupe edges by src|rel|dst.
  const edgeSet = new Set<string>();
  const edges: GEdge[] = [];
  const link = (src: string, rel: string, dst: string) => {
    const key = `${src}|${rel}|${dst}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ src, rel, dst });
  };

  // Person — everything hangs off this.
  add({
    id: PERSON_ID,
    type: "Person",
    label: "Yaphet Lemiesa",
    sectionId: "hero",
    text: "Yaphet Lemiesa — MIT EECS student (B.S. May 2027 + M.Eng May 2028) working across software, hardware, AI, and robotics. Currently a Software Engineer Intern at Bloomberg L.P., building an LLM plan-and-act DevOps agent with runbook RAG on AWS EKS/Kubernetes. Skills span Python, C++, C, SQL, Bash, Java, JavaScript/TypeScript, Go, and Bluespec SystemVerilog, plus PyTorch, RAG, knowledge graphs, vector stores (FAISS), LLM agents and evaluation, Kubernetes, AWS, Docker, and FastAPI.",
  });

  // Education → Education nodes.
  for (const edu of education) {
    const id = `education:${edu.slug}`;
    const dates = [edu.start, edu.end].filter(Boolean).join(" — ");
    add({
      id,
      type: "Education",
      label: edu.school,
      sectionId: "hero",
      text: `${edu.school} — ${edu.degree}. ${dates}. Coursework: ${edu.coursework.join(", ")}.`,
    });
    link(PERSON_ID, "STUDIED_AT", id);
  }

  // Experience → Experience nodes (work history from the resume).
  for (const exp of experience) {
    const id = `experience:${exp.slug}`;
    add({
      id,
      type: "Experience",
      label: `${exp.role}, ${exp.org}`,
      sectionId: "hero",
      text: `${exp.role} at ${exp.org} (${exp.location}), ${exp.start} – ${exp.end}. ${exp.bullets.join(" ")}`,
    });
    link(PERSON_ID, "WORKED_AT", id);
  }

  // Repos → Repo nodes, linked to Domain + Language.
  for (const repo of repos) {
    const repoId = `repo:${repo.name}`;
    const domain = classifyDomain(repo);
    const domainLabel = DOMAIN_LABEL[domain];
    const topics = repo.topics?.length ? ` Topics: ${repo.topics.join(", ")}.` : "";
    add({
      id: repoId,
      type: "Repo",
      label: repo.name,
      sectionId: "modules",
      text: `${repo.name}. ${repo.description ?? "No description."} Domain: ${domainLabel}. Language: ${repo.language ?? "n/a"}.${topics}`,
      url: repo.html_url,
    });
    link(PERSON_ID, "AUTHORED", repoId);

    const domainId = `domain:${domain}`;
    add({
      id: domainId,
      type: "Domain",
      label: domainLabel,
      sectionId: "modules",
      text: `${domainLabel} — a domain of Yaphet's engineering work.`,
    });
    link(repoId, "IN_DOMAIN", domainId);

    if (repo.language) {
      const langId = `lang:${slug(repo.language)}`;
      add({
        id: langId,
        type: "Language",
        label: repo.language,
        sectionId: "modules",
        text: `${repo.language} — a programming language Yaphet builds with.`,
      });
      link(repoId, "USES", langId);
    }
  }

  // Publications → Paper nodes.
  for (const pub of publications) {
    const id = `paper:${slug(pub.title)}`;
    add({
      id,
      type: "Paper",
      label: pub.title,
      sectionId: "publications",
      text: `Paper: ${pub.title}. Authors: ${pub.authors}. ${pub.venue}, ${pub.year}.`,
      url: pub.url,
    });
    link(PERSON_ID, "AUTHORED", id);
  }

  // Awards → Award nodes.
  for (const award of awards) {
    const id = `award:${slug(award.title)}`;
    add({
      id,
      type: "Award",
      label: award.title,
      sectionId: "awards",
      text: `Award: ${award.title}. ${award.detail}. Year: ${award.year}.`,
      url: award.url,
    });
    link(PERSON_ID, "WON", id);
  }

  // Initiatives → Initiative nodes (their prose is the richest text to embed).
  for (const ini of initiatives) {
    const id = `initiative:${ini.slug}`;
    add({
      id,
      type: "Initiative",
      label: ini.name,
      sectionId: "initiatives",
      text: `${ini.name} — ${ini.role}. ${ini.summary} ${ini.body.join(" ")}`,
      url: ini.url,
    });
    link(PERSON_ID, "MEMBER_OF", id);
  }

  // OSS contributions → external Repo + its owning Org.
  for (const oss of ossContributions) {
    const repoId = `repo:${oss.repo}`;
    add({
      id: repoId,
      type: "Repo",
      label: oss.repo,
      sectionId: "oss",
      text: `Open-source contribution to ${oss.repo}: ${oss.description}`,
      url: oss.url,
    });
    link(PERSON_ID, "CONTRIBUTED_TO", repoId);

    const owner = oss.repo.split("/")[0];
    if (owner && oss.repo.includes("/")) {
      const orgId = `org:${slug(owner)}`;
      add({
        id: orgId,
        type: "Org",
        label: owner,
        sectionId: "oss",
        text: `${owner} — an organization whose project Yaphet has contributed to.`,
        url: `https://github.com/${owner}`,
      });
      link(repoId, "PART_OF", orgId);
    }
  }

  return { nodes: [...nodeMap.values()], edges };
}

// ---- Run ---------------------------------------------------------------------

type EmbeddedNode = GNode & { embedding: number[] };

async function main() {
  console.log("→ building nodes + edges from content");
  const { nodes, edges } = await buildNodesAndEdges();
  console.log(`  ${nodes.length} nodes, ${edges.length} edges`);

  console.log("→ embedding nodes");
  const embedded: EmbeddedNode[] = [];
  for (const node of nodes) {
    const embedding = await embed(node.text);
    embedded.push({ ...node, embedding });
    process.stdout.write(".");
  }
  console.log("");

  const outDir = resolve(__dirname, "..", "graph-data");
  mkdirSync(outDir, { recursive: true });
  const jsonPath = resolve(outDir, "graph.json");
  writeFileSync(jsonPath, JSON.stringify({ nodes: embedded, edges }, null, 2));
  console.log(`→ wrote ${jsonPath}`);

  console.log("→ building Boltless snapshot");
  const snapshotDir = resolve(__dirname, "..", "backend", "graph_data");
  const result = spawnSync(
    "python3",
    [resolve(__dirname, "build_snapshot.py"), jsonPath, snapshotDir],
    { stdio: "inherit" }
  );
  if (result.status !== 0) {
    throw new Error(`build_snapshot.py exited with status ${result.status}`);
  }

  console.log(`✓ ingest complete: ${nodes.length} nodes, ${edges.length} edges`);
}

main().catch((err) => {
  console.error("✗ ingest failed:", err);
  process.exitCode = 1;
});
