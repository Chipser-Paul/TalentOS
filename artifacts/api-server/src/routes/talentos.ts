import { desc, eq, asc, and, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateAutomationBody,
  CreateCandidateBody,
  CreateAssessmentBody,
  CreateJobBody,
  CreateKnowledgeSourceBody,
  GetAnalyticsFunnelResponse,
  GetDashboardActivityResponse,
  GetDashboardSummaryResponse,
  ListAssessmentsResponse,
  ListAutomationsResponse,
  ListCandidatesResponse,
  ListJobsResponse,
  ListKnowledgeSourcesResponse,
  UpdateAutomationBody,
  UpdateCandidateBody,
  UpdateAssessmentBody,
  UpdateJobBody,
  UpdateKnowledgeSourceBody,
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
import { createCandidateEvaluator, createRagService } from "../services/ai";

const router: IRouter = Router();

async function workspaceId(res: { locals: Record<string, unknown> }): Promise<string> {
  return ensureTalentosWorkspace(getAuthenticatedUserId(res));
}

const jobResponse = (row: typeof talentosJobsTable.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

const candidateResponse = (row: typeof talentosCandidatesTable.$inferSelect) => ({
  ...row,
  appliedAt: row.appliedAt.toISOString(),
});

const assessmentResponse = (row: typeof talentosAssessmentsTable.$inferSelect) => ({
  id: row.id,
  title: row.title,
  role: row.role,
  submissions: row.submissions,
  completionRate: row.completionRate,
  averageScore: row.averageScore,
  status: row.status,
});

const knowledgeSourceResponse = (row: typeof talentosKnowledgeSourcesTable.$inferSelect) => ({
  ...row,
  updatedAt: row.updatedAt.toISOString(),
});

const automationResponse = (row: typeof talentosAutomationsTable.$inferSelect) => ({
  ...row,
});

async function recordActivity(workspaceId: string, type: "system" | "shortlist", title: string, description: string, actor: string) {
  await db.insert(talentosActivityEventsTable).values({
    id: crypto.randomUUID(),
    workspaceId,
    type,
    title,
    description,
    occurredAt: new Date(),
    actor,
  });
}

async function refreshWorkspaceMetrics(workspaceId: string) {
  const [jobStats] = await db
    .select({
      activeJobs: sql<number>`count(*) filter (where ${talentosJobsTable.status} = 'open')`,
    })
    .from(talentosJobsTable)
    .where(eq(talentosJobsTable.workspaceId, workspaceId));
  const [candidateStats] = await db
    .select({
      totalCandidates: sql<number>`count(*)`,
      shortlisted: sql<number>`count(*) filter (where ${talentosCandidatesTable.status} = 'shortlisted')`,
      averageMatch: sql<number>`coalesce(round(avg(${talentosCandidatesTable.matchScore})), 0)`,
    })
    .from(talentosCandidatesTable)
    .where(eq(talentosCandidatesTable.workspaceId, workspaceId));
  await db.update(talentosDashboardMetricsTable).set({
    activeJobs: Number(jobStats?.activeJobs ?? 0),
    totalCandidates: Number(candidateStats?.totalCandidates ?? 0),
    shortlisted: Number(candidateStats?.shortlisted ?? 0),
    averageMatch: Number(candidateStats?.averageMatch ?? 0),
  }).where(eq(talentosDashboardMetricsTable.workspaceId, workspaceId));
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
  res.json(ListJobsResponse.parse(rows.map(jobResponse)));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid job data", details: parsed.error.flatten() });
    return;
  }
  const [job] = await db.insert(talentosJobsTable).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    title: parsed.data.title.trim(),
    department: parsed.data.department.trim(),
    location: parsed.data.location.trim(),
    employmentType: parsed.data.employmentType,
    status: parsed.data.status ?? "open",
    applications: 0,
    shortlisted: 0,
    createdAt: new Date(),
  }).returning();
  await refreshWorkspaceMetrics(id);
  await recordActivity(id, "system", "Job requisition created", `${job.title} is now in the hiring workspace.`, "You");
  res.status(201).json(ListJobsResponse.element.parse(jobResponse(job)));
});

router.patch("/jobs/:jobId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid job data", details: parsed.error.flatten() });
    return;
  }
  const updates = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
  const [job] = await db.update(talentosJobsTable).set(updates).where(and(eq(talentosJobsTable.id, req.params.jobId), eq(talentosJobsTable.workspaceId, id))).returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await refreshWorkspaceMetrics(id);
  res.json(ListJobsResponse.element.parse(jobResponse(job)));
});

router.delete("/jobs/:jobId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [job] = await db.delete(talentosJobsTable).where(and(eq(talentosJobsTable.id, req.params.jobId), eq(talentosJobsTable.workspaceId, id))).returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  await refreshWorkspaceMetrics(id);
  await recordActivity(id, "system", "Job requisition removed", `${job.title} was removed from the hiring workspace.`, "You");
  res.status(204).end();
});

router.get("/candidates", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosCandidatesTable).where(eq(talentosCandidatesTable.workspaceId, id)).orderBy(desc(talentosCandidatesTable.appliedAt));
  res.json(ListCandidatesResponse.parse(rows.map(candidateResponse)));
});

router.post("/candidates", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = CreateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid candidate data", details: parsed.error.flatten() });
    return;
  }
  const [candidate] = await db.insert(talentosCandidatesTable).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    name: parsed.data.name.trim(),
    role: parsed.data.role.trim(),
    location: parsed.data.location.trim(),
    matchScore: 0,
    technicalScore: 0,
    interviewScore: 0,
    status: parsed.data.status ?? "new",
    skills: parsed.data.skills.map((skill) => skill.trim()).filter(Boolean),
    appliedAt: new Date(),
  }).returning();
  await refreshWorkspaceMetrics(id);
  await recordActivity(id, "system", "Candidate added", `${candidate.name} was added to ${candidate.role}.`, "You");
  res.status(201).json(ListCandidatesResponse.element.parse(candidateResponse(candidate)));
});

router.patch("/candidates/:candidateId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = UpdateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid candidate data", details: parsed.error.flatten() });
    return;
  }
  const updates = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map((skill) => skill.trim()).filter(Boolean) : typeof value === "string" ? value.trim() : value,
  ]));
  const [candidate] = await db.update(talentosCandidatesTable).set(updates).where(and(eq(talentosCandidatesTable.id, req.params.candidateId), eq(talentosCandidatesTable.workspaceId, id))).returning();
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  await refreshWorkspaceMetrics(id);
  res.json(ListCandidatesResponse.element.parse(candidateResponse(candidate)));
});

router.delete("/candidates/:candidateId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [candidate] = await db.delete(talentosCandidatesTable).where(and(eq(talentosCandidatesTable.id, req.params.candidateId), eq(talentosCandidatesTable.workspaceId, id))).returning();
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  await refreshWorkspaceMetrics(id);
  await recordActivity(id, "system", "Candidate removed", `${candidate.name} was removed from the candidate pool.`, "You");
  res.status(204).end();
});

router.post("/candidates/:candidateId/evaluate/:jobId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [candidate] = await db.select().from(talentosCandidatesTable).where(and(eq(talentosCandidatesTable.id, req.params.candidateId), eq(talentosCandidatesTable.workspaceId, id)));
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  const [job] = await db.select().from(talentosJobsTable).where(and(eq(talentosJobsTable.id, req.params.jobId), eq(talentosJobsTable.workspaceId, id)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  try {
    const evaluation = await createCandidateEvaluator().evaluate({
      candidate: {
        name: candidate.name,
        role: candidate.role,
        location: candidate.location,
        skills: candidate.skills,
        status: candidate.status,
      },
      job: {
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        status: job.status,
      },
    });
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: "Failed to evaluate candidate" });
  }
});

router.get("/assessments", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosAssessmentsTable).where(eq(talentosAssessmentsTable.workspaceId, id));
  res.json(ListAssessmentsResponse.parse(rows));
});

router.post("/assessments", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = CreateAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assessment data", details: parsed.error.flatten() });
    return;
  }
  const [assessment] = await db.insert(talentosAssessmentsTable).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    title: parsed.data.title.trim(),
    role: parsed.data.role.trim(),
    submissions: 0,
    completionRate: 0,
    averageScore: 0,
    status: parsed.data.status ?? "draft",
  }).returning();
  await recordActivity(id, "system", "Assessment created", `${assessment.title} is ready for assessment design.`, "You");
  res.status(201).json(ListAssessmentsResponse.element.parse(assessmentResponse(assessment)));
});

router.patch("/assessments/:assessmentId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = UpdateAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assessment data", details: parsed.error.flatten() });
    return;
  }
  const updates = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
  const [assessment] = await db.update(talentosAssessmentsTable).set(updates).where(and(eq(talentosAssessmentsTable.id, req.params.assessmentId), eq(talentosAssessmentsTable.workspaceId, id))).returning();
  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }
  res.json(ListAssessmentsResponse.element.parse(assessmentResponse(assessment)));
});

router.delete("/assessments/:assessmentId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [assessment] = await db.delete(talentosAssessmentsTable).where(and(eq(talentosAssessmentsTable.id, req.params.assessmentId), eq(talentosAssessmentsTable.workspaceId, id))).returning();
  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }
  await recordActivity(id, "system", "Assessment removed", `${assessment.title} was removed from the assessment library.`, "You");
  res.status(204).end();
});

router.get("/knowledge/sources", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosKnowledgeSourcesTable).where(eq(talentosKnowledgeSourcesTable.workspaceId, id)).orderBy(desc(talentosKnowledgeSourcesTable.updatedAt));
  res.json(ListKnowledgeSourcesResponse.parse(rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }))));
});

router.post("/knowledge/sources", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = CreateKnowledgeSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid knowledge source data", details: parsed.error.flatten() });
    return;
  }
  const [source] = await db.insert(talentosKnowledgeSourcesTable).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    name: parsed.data.name.trim(),
    kind: parsed.data.kind,
    chunks: 0,
    updatedAt: new Date(),
    status: parsed.data.status ?? "ready",
  }).returning();
  res.status(201).json(ListKnowledgeSourcesResponse.element.parse(knowledgeSourceResponse(source)));
});

router.patch("/knowledge/sources/:sourceId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = UpdateKnowledgeSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid knowledge source data", details: parsed.error.flatten() });
    return;
  }
  const updates = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
  const [source] = await db.update(talentosKnowledgeSourcesTable).set(updates).where(and(eq(talentosKnowledgeSourcesTable.id, req.params.sourceId), eq(talentosKnowledgeSourcesTable.workspaceId, id))).returning();
  if (!source) {
    res.status(404).json({ error: "Knowledge source not found" });
    return;
  }
  res.json(ListKnowledgeSourcesResponse.element.parse(knowledgeSourceResponse(source)));
});

router.delete("/knowledge/sources/:sourceId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [source] = await db.delete(talentosKnowledgeSourcesTable).where(and(eq(talentosKnowledgeSourcesTable.id, req.params.sourceId), eq(talentosKnowledgeSourcesTable.workspaceId, id))).returning();
  if (!source) {
    res.status(404).json({ error: "Knowledge source not found" });
    return;
  }
  res.status(204).end();
});

router.post("/knowledge/query", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const { query } = req.body as { query?: string };
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  try {
    const result = await createRagService().query({ workspaceId: id, query: query.trim() });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to query knowledge base" });
  }
});

router.get("/automations", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosAutomationsTable).where(eq(talentosAutomationsTable.workspaceId, id));
  res.json(ListAutomationsResponse.parse(rows.map(automationResponse)));
});

router.post("/automations", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = CreateAutomationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid automation data", details: parsed.error.flatten() });
    return;
  }
  const [automation] = await db.insert(talentosAutomationsTable).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    name: parsed.data.name.trim(),
    trigger: parsed.data.trigger.trim(),
    status: parsed.data.status ?? "draft",
  }).returning();
  res.status(201).json(ListAutomationsResponse.element.parse(automationResponse(automation)));
});

router.patch("/automations/:automationId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const parsed = UpdateAutomationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid automation data", details: parsed.error.flatten() });
    return;
  }
  const updates = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
  const [automation] = await db.update(talentosAutomationsTable).set(updates).where(and(eq(talentosAutomationsTable.id, req.params.automationId), eq(talentosAutomationsTable.workspaceId, id))).returning();
  if (!automation) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }
  res.json(ListAutomationsResponse.element.parse(automationResponse(automation)));
});

router.delete("/automations/:automationId", async (req, res): Promise<void> => {
  const id = await workspaceId(res);
  const [automation] = await db.delete(talentosAutomationsTable).where(and(eq(talentosAutomationsTable.id, req.params.automationId), eq(talentosAutomationsTable.workspaceId, id))).returning();
  if (!automation) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }
  res.status(204).end();
});

router.get("/analytics/funnel", async (_req, res): Promise<void> => {
  const id = await workspaceId(res);
  const rows = await db.select().from(talentosFunnelStagesTable).where(eq(talentosFunnelStagesTable.workspaceId, id)).orderBy(asc(talentosFunnelStagesTable.sortOrder));
  res.json(GetAnalyticsFunnelResponse.parse(rows.map(({ label, count, conversionRate }) => ({ label, count, conversionRate }))));
});

export default router;