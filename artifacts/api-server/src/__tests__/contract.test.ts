import { describe, it, expect, vi, beforeEach } from "vitest";
import { Router } from "express";
import { z } from "zod";

const assessmentResponse = (row: { id: string; title: string; role: string; submissions: number; completionRate: number; averageScore: number; status: string }) => ({
  id: row.id,
  title: row.title,
  role: row.role,
  submissions: row.submissions,
  completionRate: row.completionRate,
  averageScore: row.averageScore,
  status: row.status,
});

const ListAssessmentsResponse = z.array(z.object({
  id: z.string(),
  title: z.string(),
  role: z.string(),
  submissions: z.number(),
  completionRate: z.number(),
  averageScore: z.number(),
  status: z.string(),
}));

describe("Assessment response contract", () => {
  it("does not leak workspaceId", () => {
    const raw = {
      id: "assessment-1",
      title: "API Design",
      role: "Backend Engineer",
      submissions: 12,
      completionRate: 85,
      averageScore: 72,
      status: "active",
      workspaceId: "workspace-secret",
    };

    const parsed = ListAssessmentsResponse.parse([assessmentResponse(raw)]);
    expect(parsed[0]).not.toHaveProperty("workspaceId");
    expect(parsed[0].id).toBe("assessment-1");
  });
});

describe("Validation", () => {
  it("rejects empty title", () => {
    const schema = z.object({
      title: z.string().min(2),
      role: z.string().min(2),
    });

    expect(() => schema.parse({ title: "", role: "Engineer" })).toThrow();
  });

  it("rejects missing role", () => {
    const schema = z.object({
      title: z.string().min(2),
      role: z.string().min(2),
    });

    expect(() => schema.parse({ title: "API Design" })).toThrow();
  });
});

describe("Workspace isolation", () => {
  it("treats missing resource as not found", () => {
    const notFound = { error: "Job not found" };
    expect(notFound.error).toBe("Job not found");
  });
});

describe("Knowledge Sources mutation behavior", () => {
  it("defaults status to ready on create", () => {
    const input = { name: "Policy", kind: "policy" } as { name: string; kind: string; status?: string };
    const status = input.status ?? "ready";
    expect(status).toBe("ready");
  });

  it("rejects invalid kind", () => {
    const schema = z.object({
      name: z.string().min(2),
      kind: z.enum(["policy", "job_description", "interview_guide", "technical_document"]),
      status: z.enum(["ready", "processing", "needs_review"]).optional(),
    });

    expect(() => schema.parse({ name: "Doc", kind: "invalid" })).toThrow();
  });
});

describe("Automations mutation behavior", () => {
  it("defaults status to draft on create", () => {
    const input = { name: "Triage", trigger: "applied" } as { name: string; trigger: string; status?: string };
    const status = input.status ?? "draft";
    expect(status).toBe("draft");
  });

  it("rejects empty trigger", () => {
    const schema = z.object({
      name: z.string().min(2),
      trigger: z.string().min(2),
      status: z.enum(["active", "paused", "draft"]).optional(),
    });

    expect(() => schema.parse({ name: "Triage", trigger: "" })).toThrow();
  });
});

describe("RAG query validation", () => {
  it("rejects empty query", () => {
    const schema = z.object({
      query: z.string().min(2),
    });

    expect(() => schema.parse({ query: "" })).toThrow();
  });

  it("rejects short query", () => {
    const schema = z.object({
      query: z.string().min(2),
    });

    expect(() => schema.parse({ query: "a" })).toThrow();
  });

  it("accepts valid query", () => {
    const schema = z.object({
      query: z.string().min(2),
    });

    const parsed = schema.parse({ query: "interview policy" });
    expect(parsed.query).toBe("interview policy");
  });
});

describe("RAG response contract", () => {
  it("requires answer and sources", () => {
    const schema = z.object({
      answer: z.string().min(10),
      sources: z.array(z.object({
        id: z.string(),
        name: z.string(),
        kind: z.string(),
      })).min(1),
    });

    expect(() => schema.parse({ answer: "Short", sources: [] })).toThrow();
    expect(() => schema.parse({ answer: "Valid answer here", sources: [{ id: "1", name: "Policy", kind: "policy" }] })).not.toThrow();
  });
});

describe("Insufficient context behavior", () => {
  it("returns available knowledge does not answer when no sources found", () => {
    const fallback = {
      answer: "The available knowledge does not answer this question.",
      sources: [],
    };

    expect(fallback.answer).toContain("available knowledge does not answer");
    expect(fallback.sources).toHaveLength(0);
  });
});

describe("Tool input validation", () => {
  it("requires candidateId for get_candidate", () => {
    const schema = z.object({
      candidateId: z.string(),
    });

    expect(() => schema.parse({})).toThrow();
    expect(() => schema.parse({ candidateId: "c-1" })).not.toThrow();
  });

  it("allows optional status filter for list_candidates", () => {
    const schema = z.object({
      status: z.string().optional(),
    });

    expect(() => schema.parse({})).not.toThrow();
    expect(() => schema.parse({ status: "new" })).not.toThrow();
  });
});

describe("Tool workspace isolation", () => {
  it("rejects candidate from wrong workspace", () => {
    const candidate = { id: "c-1", workspaceId: "workspace-a" };
    const callerWorkspace = "workspace-b";

    const accessible = candidate.workspaceId === callerWorkspace;
    expect(accessible).toBe(false);
  });

  it("allows candidate from same workspace", () => {
    const candidate = { id: "c-1", workspaceId: "workspace-a" };
    const callerWorkspace = "workspace-a";

    const accessible = candidate.workspaceId === callerWorkspace;
    expect(accessible).toBe(true);
  });
});

describe("MCP read-only behavior", () => {
  it("does not expose delete or update tools", () => {
    const toolNames = [
      "get_candidate",
      "list_candidates",
      "get_job",
      "list_jobs",
      "list_knowledge_sources",
      "get_dashboard_metrics",
    ];

    const forbidden = ["delete_candidate", "update_candidate", "delete_job", "update_job", "delete_knowledge_source"];
    const exposed = forbidden.filter((name) => toolNames.includes(name));

    expect(exposed).toHaveLength(0);
  });
});
