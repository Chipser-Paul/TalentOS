import { eq } from "drizzle-orm";
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
  talentosWorkspacesTable,
} from "@workspace/db";

const at = (value: string) => new Date(value);

export async function ensureTalentosWorkspace(clerkUserId: string): Promise<string> {
  const workspaceId = `workspace:${clerkUserId}`;
  const existing = await db
    .select({ id: talentosWorkspacesTable.id })
    .from(talentosWorkspacesTable)
    .where(eq(talentosWorkspacesTable.id, workspaceId))
    .limit(1);

  if (existing[0]) return workspaceId;

  await db.transaction(async (tx) => {
    const id = (kind: string, index: number) => `${workspaceId}:${kind}-${index}`;
    await tx.insert(talentosWorkspacesTable).values({
      id: workspaceId,
      ownerClerkUserId: clerkUserId,
      name: "Northstar Labs",
    });

    await tx.insert(talentosJobsTable).values([
      { id: id("job", 1), workspaceId, title: "Senior Full-Stack Engineer", department: "Product Engineering", location: "Remote · Africa", employmentType: "full_time", status: "open", applications: 248, shortlisted: 12, createdAt: at("2026-07-28T09:00:00.000Z") },
      { id: id("job", 2), workspaceId, title: "AI Platform Engineer", department: "Applied Intelligence", location: "Lagos · Hybrid", employmentType: "full_time", status: "open", applications: 96, shortlisted: 8, createdAt: at("2026-08-02T09:00:00.000Z") },
      { id: id("job", 3), workspaceId, title: "Product Designer", department: "Design", location: "Remote · Worldwide", employmentType: "contract", status: "paused", applications: 74, shortlisted: 5, createdAt: at("2026-07-19T09:00:00.000Z") },
    ]);

    await tx.insert(talentosCandidatesTable).values([
      { id: id("candidate", 1), workspaceId, name: "Paul Fokoua", role: "Senior Full-Stack Engineer", location: "Yaoundé, Cameroon", matchScore: 94, technicalScore: 91, interviewScore: 88, status: "shortlisted", skills: ["React", "Node.js", "PostgreSQL", "TypeScript"], appliedAt: at("2026-08-14T09:12:00.000Z") },
      { id: id("candidate", 2), workspaceId, name: "Mariam Eze", role: "Senior Full-Stack Engineer", location: "Lagos, Nigeria", matchScore: 87, technicalScore: 84, interviewScore: 91, status: "assessment", skills: ["TypeScript", "FastAPI", "Redis", "Docker"], appliedAt: at("2026-08-13T11:20:00.000Z") },
      { id: id("candidate", 3), workspaceId, name: "Daniel Okoro", role: "AI Platform Engineer", location: "Accra, Ghana", matchScore: 82, technicalScore: 79, interviewScore: 84, status: "interview", skills: ["Python", "RAG", "OpenAI", "AWS"], appliedAt: at("2026-08-12T15:40:00.000Z") },
      { id: id("candidate", 4), workspaceId, name: "Amina Bello", role: "Product Designer", location: "Abuja, Nigeria", matchScore: 72, technicalScore: 69, interviewScore: 76, status: "screening", skills: ["Figma", "Research", "Prototyping"], appliedAt: at("2026-08-11T10:05:00.000Z") },
    ]);

    await tx.insert(talentosAssessmentsTable).values([
      { id: id("assessment", 1), workspaceId, title: "Production API Architecture", role: "Senior Full-Stack Engineer", submissions: 38, completionRate: 76, averageScore: 81, status: "active" },
      { id: id("assessment", 2), workspaceId, title: "RAG Pipeline Implementation", role: "AI Platform Engineer", submissions: 16, completionRate: 64, averageScore: 78, status: "active" },
      { id: id("assessment", 3), workspaceId, title: "Product Thinking Sprint", role: "Product Designer", submissions: 30, completionRate: 88, averageScore: 86, status: "draft" },
    ]);

    await tx.insert(talentosKnowledgeSourcesTable).values([
      { id: id("source", 1), workspaceId, name: "Engineering hiring principles", kind: "policy", chunks: 42, updatedAt: at("2026-08-12T10:30:00.000Z"), status: "ready" },
      { id: id("source", 2), workspaceId, name: "Senior backend job description", kind: "job_description", chunks: 18, updatedAt: at("2026-08-10T14:20:00.000Z"), status: "ready" },
      { id: id("source", 3), workspaceId, name: "Technical interview playbook", kind: "interview_guide", chunks: 67, updatedAt: at("2026-08-08T09:15:00.000Z"), status: "processing" },
    ]);

    await tx.insert(talentosAutomationsTable).values([
      { id: id("automation", 1), workspaceId, name: "New application screening", trigger: "When a new application arrives", steps: 5, runsThisMonth: 184, status: "active" },
      { id: id("automation", 2), workspaceId, name: "Assessment reminder", trigger: "48 hours before assessment deadline", steps: 3, runsThisMonth: 62, status: "active" },
      { id: id("automation", 3), workspaceId, name: "Hiring manager handoff", trigger: "When candidate is shortlisted", steps: 4, runsThisMonth: 28, status: "paused" },
    ]);

    await tx.insert(talentosActivityEventsTable).values([
      { id: id("activity", 1), workspaceId, type: "screening", title: "AI screening completed", description: "42 new applications were scored for Full-Stack Engineer.", occurredAt: at("2026-08-15T08:42:00.000Z"), actor: "TalentOS Agent" },
      { id: id("activity", 2), workspaceId, type: "assessment", title: "Assessment submitted", description: "Mariam Eze submitted the Node.js API challenge.", occurredAt: at("2026-08-15T07:18:00.000Z"), actor: "Mariam Eze" },
      { id: id("activity", 3), workspaceId, type: "shortlist", title: "Candidate shortlisted", description: "Paul Fokoua moved to the hiring manager review stage.", occurredAt: at("2026-08-14T16:05:00.000Z"), actor: "Ada Nwosu" },
      { id: id("activity", 4), workspaceId, type: "interview", title: "Interview scheduled", description: "Architecture interview confirmed for Friday at 10:00.", occurredAt: at("2026-08-14T13:30:00.000Z"), actor: "TalentOS Agent" },
    ]);

    await tx.insert(talentosDashboardMetricsTable).values({
      workspaceId,
      activeJobs: 8,
      totalCandidates: 248,
      technicalAssessments: 84,
      interviewsScheduled: 31,
      shortlisted: 12,
      averageMatch: 82,
    });

    await tx.insert(talentosFunnelStagesTable).values([
      { id: id("funnel", 1), workspaceId, label: "Visitors", count: 1000, conversionRate: 100, sortOrder: 1 },
      { id: id("funnel", 2), workspaceId, label: "Started application", count: 420, conversionRate: 42, sortOrder: 2 },
      { id: id("funnel", 3), workspaceId, label: "Completed", count: 310, conversionRate: 74, sortOrder: 3 },
      { id: id("funnel", 4), workspaceId, label: "AI screened", count: 180, conversionRate: 58, sortOrder: 4 },
      { id: id("funnel", 5), workspaceId, label: "Technical assessment", count: 70, conversionRate: 39, sortOrder: 5 },
      { id: id("funnel", 6), workspaceId, label: "Interview", count: 25, conversionRate: 36, sortOrder: 6 },
      { id: id("funnel", 7), workspaceId, label: "Hired", count: 8, conversionRate: 32, sortOrder: 7 },
    ]);
  });

  return workspaceId;
}