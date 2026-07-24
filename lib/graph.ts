// Neo4j driver client (server-only). Singleton driver + small read/write
// helpers + a bootstrap for the vector index. Used by ingest.ts, retrieval.ts,
// and /api/ask. Never import this from a client component.

import neo4j, { Driver, RecordShape } from "neo4j-driver";
import { EMBED_DIM } from "./embed";

const URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const USER = process.env.NEO4J_USER || "neo4j";
const PASSWORD = process.env.NEO4J_PASSWORD || "password";

// All entity nodes share the :Entity label so one vector index covers them.
export const ENTITY_LABEL = "Entity";
export const VECTOR_INDEX = "node_embed";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
      // Keep the pool small; this is a single-user local app.
      maxConnectionPoolSize: 10,
    });
  }
  return driver;
}

/** Run a read query and return plain record objects. */
export async function runRead<T extends RecordShape = RecordShape>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const res = await session.run<T>(cypher, params);
    return res.records.map((r) => r.toObject());
  } finally {
    await session.close();
  }
}

/** Run a write query. */
export async function runWrite<T extends RecordShape = RecordShape>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const res = await session.run<T>(cypher, params);
    return res.records.map((r) => r.toObject());
  } finally {
    await session.close();
  }
}

/**
 * Create the vector index over :Entity(embedding) if it doesn't exist.
 * Safe to call repeatedly (IF NOT EXISTS). Call once from ingest before writing.
 */
export async function ensureVectorIndex(): Promise<void> {
  await runWrite(
    `CREATE VECTOR INDEX ${VECTOR_INDEX} IF NOT EXISTS
     FOR (n:${ENTITY_LABEL}) ON (n.embedding)
     OPTIONS { indexConfig: {
       \`vector.dimensions\`: $dim,
       \`vector.similarity_function\`: 'cosine'
     } }`,
    { dim: EMBED_DIM }
  );
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
