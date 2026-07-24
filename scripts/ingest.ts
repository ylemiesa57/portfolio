/**
 * ⟢ Retrieval-layer file (your ownership area) — the ETL pipeline.
 *
 * Pulls repos (lib/github.ts) + static content (lib/content.ts), turns them
 * into graph nodes/edges, embeds each node locally (Ollama), and MERGEs
 * everything into Neo4j. Idempotent: re-run any time (`npm run ingest`).
 *
 * Prereqs (see KNOWLEDGE_GRAPH.md):
 *   - Neo4j up:            docker compose up -d
 *   - Embed model pulled:  ollama pull nomic-embed-text
 */

// Relative imports (not the "@/" alias): this runs under tsx, whose esbuild
// resolver ignores tsconfig `paths`.
import { getRepos, classifyDomain, DOMAIN_LABEL } from "../lib/github";
import {
  awards,
  initiatives,
  ossContributions,
  publications,
} from "../lib/content";
import { embed } from "../lib/embed";
import {
  ensureVectorIndex,
  runWrite,
  closeDriver,
  ENTITY_LABEL,
} from "../lib/graph";
import type { GNode, GEdge } from "../lib/graph-types";

const PERSON_ID = "person:yaphet";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// ---- Neo4j write helpers (the pattern reused for every node/edge) -----------

/** Upsert one node with its embedding. MERGE on id so re-runs update in place. */
async function upsertNode(node: GNode, embedding: number[]): Promise<void> {
  await runWrite(
    `MERGE (n:${ENTITY_LABEL} {id: $id})
     SET n.type = $type, n.label = $label, n.sectionId = $sectionId,
         n.text = $text, n.url = $url, n.embedding = $embedding`,
    { ...node, url: node.url ?? null, embedding }
  );
}

/** Upsert one edge between two existing nodes. */
async function upsertEdge(edge: GEdge): Promise<void> {
  await runWrite(
    `MATCH (a:${ENTITY_LABEL} {id: $src}), (b:${ENTITY_LABEL} {id: $dst})
     MERGE (a)-[r:REL {rel: $rel}]->(b)`,
    { src: edge.src, rel: edge.rel, dst: edge.dst }
  );
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
    text: "Yaphet Lemiesa — student working across software, hardware, AI, and robotics.",
  });

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

async function main() {
  console.log("→ ensuring vector index");
  await ensureVectorIndex();

  console.log("→ building nodes + edges from content");
  const { nodes, edges } = await buildNodesAndEdges();
  console.log(`  ${nodes.length} nodes, ${edges.length} edges`);

  console.log("→ embedding + upserting nodes");
  for (const node of nodes) {
    const vec = await embed(node.text);
    await upsertNode(node, vec);
    process.stdout.write(".");
  }
  console.log("");

  console.log("→ upserting edges");
  for (const edge of edges) await upsertEdge(edge);

  console.log(`✓ ingest complete: ${nodes.length} nodes, ${edges.length} edges`);
}

main()
  .catch((err) => {
    console.error("✗ ingest failed:", err);
    process.exitCode = 1;
  })
  .finally(closeDriver);
