import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ToolDefinition, ToolContext } from "./tool.js";
import { db } from "@workspace/db";
import {
  talentosCandidatesTable,
  talentosJobsTable,
  talentosKnowledgeSourcesTable,
  talentosDashboardMetricsTable,
} from "@workspace/db";

const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  location: z.string(),
  matchScore: z.number(),
  technicalScore: z.number(),
  interviewScore: z.number(),
  status: z.string(),
  skills: z.array(z.string()),
  appliedAt: z.string(),
});

const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  employmentType: z.string(),
  status: z.string(),
  applications: z.number(),
  shortlisted: z.number(),
  createdAt: z.string(),
});

const KnowledgeSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  status: z.string(),
  updatedAt: z.string(),
});

const DashboardMetricsSchema = z.object({
  activeJobs: z.number(),
  totalCandidates: z.number(),
  technicalAssessments: z.number(),
  interviewsScheduled: z.number(),
  shortlisted: z.number(),
  averageMatch: z.number(),
});

export const GetCandidateTool: ToolDefinition<{ candidateId: string }, { candidate: z.infer<typeof CandidateSchema> }> = {
  name: "get_candidate",
  description: "Get a candidate profile by ID within the current workspace.",
  inputSchema: {
    type: "object",
    properties: {
      candidateId: { type: "string" },
    },
    required: ["candidateId"],
  },
  async execute(input, context: ToolContext) {
    const [candidate] = await db
      .select()
      .from(talentosCandidatesTable)
      .where(eq(talentosCandidatesTable.id, input.candidateId))
      .limit(1);

    if (!candidate || candidate.workspaceId !== context.workspaceId) {
      throw new Error("Candidate not found");
    }

    return {
      candidate: CandidateSchema.parse({
        ...candidate,
        appliedAt: candidate.appliedAt.toISOString(),
      }),
    };
  },
};

export const ListCandidatesTool: ToolDefinition<{ status?: string }, { candidates: z.infer<typeof CandidateSchema>[] }> = {
  name: "list_candidates",
  description: "List candidates in the current workspace.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string" },
    },
  },
  async execute(input, context: ToolContext) {
    const candidates = await db
      .select()
      .from(talentosCandidatesTable)
      .where(eq(talentosCandidatesTable.workspaceId, context.workspaceId));

    const filtered = input.status
      ? candidates.filter((c) => c.status === input.status)
      : candidates;

    return {
      candidates: filtered.map((candidate) =>
        CandidateSchema.parse({
          ...candidate,
          appliedAt: candidate.appliedAt.toISOString(),
        }),
      ),
    };
  },
};

export const GetJobTool: ToolDefinition<{ jobId: string }, { job: z.infer<typeof JobSchema> }> = {
  name: "get_job",
  description: "Get a job requisition by ID within the current workspace.",
  inputSchema: {
    type: "object",
    properties: {
      jobId: { type: "string" },
    },
    required: ["jobId"],
  },
  async execute(input, context: ToolContext) {
    const [job] = await db
      .select()
      .from(talentosJobsTable)
      .where(eq(talentosJobsTable.id, input.jobId))
      .limit(1);

    if (!job || job.workspaceId !== context.workspaceId) {
      throw new Error("Job not found");
    }

    return {
      job: JobSchema.parse({
        ...job,
        createdAt: job.createdAt.toISOString(),
      }),
    };
  },
};

export const ListJobsTool: ToolDefinition<{ status?: string }, { jobs: z.infer<typeof JobSchema>[] }> = {
  name: "list_jobs",
  description: "List job requisitions in the current workspace.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string" },
    },
  },
  async execute(input, context: ToolContext) {
    const jobs = await db
      .select()
      .from(talentosJobsTable)
      .where(eq(talentosJobsTable.workspaceId, context.workspaceId));

    const filtered = input.status ? jobs.filter((j) => j.status === input.status) : jobs;

    return {
      jobs: filtered.map((job) =>
        JobSchema.parse({
          ...job,
          createdAt: job.createdAt.toISOString(),
        }),
      ),
    };
  },
};

export const ListKnowledgeSourcesTool: ToolDefinition<{ kind?: string }, { sources: z.infer<typeof KnowledgeSourceSchema>[] }> = {
  name: "list_knowledge_sources",
  description: "List knowledge sources in the current workspace.",
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string" },
    },
  },
  async execute(input, context: ToolContext) {
    const sources = await db
      .select()
      .from(talentosKnowledgeSourcesTable)
      .where(eq(talentosKnowledgeSourcesTable.workspaceId, context.workspaceId));

    const filtered = input.kind ? sources.filter((s) => s.kind === input.kind) : sources;

    return {
      sources: filtered.map((source) =>
        KnowledgeSourceSchema.parse({
          ...source,
          updatedAt: source.updatedAt.toISOString(),
        }),
      ),
    };
  },
};

export const GetDashboardMetricsTool: ToolDefinition<{}, { metrics: z.infer<typeof DashboardMetricsSchema> }> = {
  name: "get_dashboard_metrics",
  description: "Get current dashboard metrics for the workspace.",
  inputSchema: { type: "object", properties: {} },
  async execute(_input, context: ToolContext) {
    const [metrics] = await db
      .select()
      .from(talentosDashboardMetricsTable)
      .where(eq(talentosDashboardMetricsTable.workspaceId, context.workspaceId))
      .limit(1);

    if (!metrics) {
      return {
        metrics: {
          activeJobs: 0,
          totalCandidates: 0,
          technicalAssessments: 0,
          interviewsScheduled: 0,
          shortlisted: 0,
          averageMatch: 0,
        },
      };
    }

    return {
      metrics: DashboardMetricsSchema.parse(metrics),
    };
  },
};

export const Tools = [
  GetCandidateTool,
  ListCandidatesTool,
  GetJobTool,
  ListJobsTool,
  ListKnowledgeSourcesTool,
  GetDashboardMetricsTool,
];
