import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { talentosKnowledgeSourcesTable } from "@workspace/db";

export interface RetrievalResult {
  id: string;
  name: string;
  kind: string;
  content: string;
  rank: number;
}

export async function retrieveKnowledgeSources(options: {
  workspaceId: string;
  query: string;
  limit?: number;
}): Promise<RetrievalResult[]> {
  const { workspaceId, query, limit = 5 } = options;
  const sanitized = query.replace(/[^\w\s]/g, " ").trim();
  if (!sanitized) {
    return [];
  }

  const result = await db.execute(sql`
    SELECT
      id,
      name,
      kind,
      content,
      ts_rank(to_tsvector('english', name || ' ' || content), plainto_tsquery('english', ${sanitized})) AS rank
    FROM ${talentosKnowledgeSourcesTable}
    WHERE workspace_id = ${workspaceId}
      AND to_tsvector('english', name || ' ' || content) @@ plainto_tsquery('english', ${sanitized})
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  return (result.rows ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    kind: String(row.kind),
    content: String(row.content),
    rank: Number(row.rank ?? 0),
  }));
}
