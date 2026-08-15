import { desc, eq, asc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAnalyticsFunnelResponse,
  GetDashboardActivityResponse,
  GetDashboardSummaryResponse,
  ListAssessmentsResponse,
  ListAutomationsResponse,
  ListCandidatesResponse,
  ListJobsResponse,
  ListKnowledgeSourcesResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  talentosActivityEventsTable,
  talentosAssessmentsTable,
  talentosAutomationsTable,
  talentosCandidatesTable,
  talentosDashboardMetricsTable,
  talentosFunnelStagesTable,
  talentosJobsTable,
  talentosKnowledgeSourcesTable,
} from "@workspace/db";
import { getAuthenticatedUserId } from "../middlewares/auth";
import { ensureTalentosWorkspace } from "../lib/talentos-seed";

const router: IRouter = Router();

async function workspaceId(res: { locals: Record<string, unknown> }): Promise<string> {
  return ensureTalentosWorkspace(getAuthenticatedUserId(res));
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [metrics] = await db.select().from(talentosDashboardMetricsTable).where(eq(talentosDashboardMetricsTable.workspaceId, id));
  res.json(GetDashboardSummaryResponse.parse(metrics));
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosActivityEventsTable).where(eq(talentosActivityEventsTable.workspaceId, id)).orderBy(desc(talentosActivityEventsTable.occurredAt));
  res.json(GetDashboardActivityResponse.parse(rows.map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() }))));
});

router.get("/jobs", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosJobsTable).where(eq(talentosJobsTable.workspaceId, id)).orderBy(desc(talentosJobsTable.createdAt));
  res.json(ListJobsResponse.parse(rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))));
});

router.get("/candidates", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosCandidatesTable).where(eq(talentosCandidatesTable.workspaceId, id)).orderBy(desc(talentosCandidatesTable.appliedAt));
  res.json(ListCandidatesResponse.parse(rows.map((row) => ({ ...row, appliedAt: row.appliedAt.toISOString() }))));
});

router.get("/assessments", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosAssessmentsTable).where(eq(talentosAssessmentsTable.workspaceId, id));
  res.json(ListAssessmentsResponse.parse(rows));
});

router.get("/knowledge/sources", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosKnowledgeSourcesTable).where(eq(talentosKnowledgeSourcesTable.workspaceId, id)).orderBy(desc(talentosKnowledgeSourcesTable.updatedAt));
  res.json(ListKnowledgeSourcesResponse.parse(rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }))));
});

router.get("/automations", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosAutomationsTable).where(eq(talentosAutomationsTable.workspaceId, id));
  res.json(ListAutomationsResponse.parse(rows));
});

router.get("/analytics/funnel", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosFunnelStagesTable).where(eq(talentosFunnelStagesTable.workspaceId, id)).orderBy(asc(talentosFunnelStagesTable.sortOrder));
  res.json(GetAnalyticsFunnelResponse.parse(rows.map(({ label, count, conversionRate }) => ({ label, count, conversionRate }))));
});

export default router;