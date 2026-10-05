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
import { getRepos } from "../lib/github";
import { buildNodesAndEdges, SEEDABLE_TYPES } from "../lib/graph-build";
import { embed } from "../lib/embed";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GNode } from "../lib/graph-types";

// The graph itself (nodes, edges, ids) is built by lib/graph-build.ts, which
// app/page.tsx also uses to draw the chart at the top of the page -- one
// builder, so the drawing and the searchable snapshot never disagree.

// ---- Run ---------------------------------------------------------------------

type EmbeddedNode = GNode & { embedding?: number[] };

async function main() {
  console.log("→ building nodes + edges from content");
  const repos = await getRepos();
  const { nodes, edges } = buildNodesAndEdges(repos);
  console.log(`  ${nodes.length} nodes, ${edges.length} edges`);

  const seedable = nodes.filter((n) => SEEDABLE_TYPES.has(n.type));
  console.log(
    `→ embedding ${seedable.length} seedable nodes ` +
      `(skipping ${nodes.length - seedable.length} Domain/Language/Org boilerplate nodes)`
  );
  const embedded: EmbeddedNode[] = [];
  for (const node of nodes) {
    if (!SEEDABLE_TYPES.has(node.type)) {
      embedded.push({ ...node });
      continue;
    }
    // RETRIEVAL_DOCUMENT is the document half of Gemini's asymmetric
    // retrieval pair; lib/retrieval.ts embeds the query with RETRIEVAL_QUERY.
    const embedding = await embed(node.text, "RETRIEVAL_DOCUMENT");
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

  console.log(
    `✓ ingest complete: ${nodes.length} nodes ` +
      `(${embedded.filter((n) => n.embedding).length} embedded), ${edges.length} edges`
  );
}

main().catch((err) => {
  console.error("✗ ingest failed:", err);
  process.exitCode = 1;
});
