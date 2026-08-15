import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const talentosWorkspacesTable = pgTable("talentos_workspaces", {
  id: text("id").primaryKey(),
  ownerClerkUserId: text("owner_clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const talentosJobsTable = pgTable("talentos_jobs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  employmentType: text("employment_type").notNull(),
  status: text("status").notNull(),
  applications: integer("applications").notNull().default(0),
  shortlisted: integer("shortlisted").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const talentosCandidatesTable = pgTable("talentos_candidates", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  matchScore: integer("match_score").notNull(),
  technicalScore: integer("technical_score").notNull(),
  interviewScore: integer("interview_score").notNull(),
  status: text("status").notNull(),
  skills: text("skills").array().notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
});

export const talentosAssessmentsTable = pgTable("talentos_assessments", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  role: text("role").notNull(),
  submissions: integer("submissions").notNull().default(0),
  completionRate: integer("completion_rate").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  status: text("status").notNull(),
});

export const talentosKnowledgeSourcesTable = pgTable("talentos_knowledge_sources", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  chunks: integer("chunks").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
});

export const talentosAutomationsTable = pgTable("talentos_automations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  steps: integer("steps").notNull().default(0),
  runsThisMonth: integer("runs_this_month").notNull().default(0),
  status: text("status").notNull(),
});

export const talentosActivityEventsTable = pgTable("talentos_activity_events", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  actor: text("actor").notNull(),
});

export const talentosDashboardMetricsTable = pgTable("talentos_dashboard_metrics", {
  workspaceId: text("workspace_id").primaryKey().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  activeJobs: integer("active_jobs").notNull().default(0),
  totalCandidates: integer("total_candidates").notNull().default(0),
  technicalAssessments: integer("technical_assessments").notNull().default(0),
  interviewsScheduled: integer("interviews_scheduled").notNull().default(0),
  shortlisted: integer("shortlisted").notNull().default(0),
  averageMatch: integer("average_match").notNull().default(0),
});

export const talentosFunnelStagesTable = pgTable("talentos_funnel_stages", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => talentosWorkspacesTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  count: integer("count").notNull().default(0),
  conversionRate: integer("conversion_rate").notNull().default(0),
  sortOrder: integer("sort_order").notNull(),
});

export const insertTalentosWorkspaceSchema = createInsertSchema(talentosWorkspacesTable).omit({ createdAt: true, updatedAt: true });
export const insertTalentosJobSchema = createInsertSchema(talentosJobsTable).omit({ createdAt: true });
export const insertTalentosCandidateSchema = createInsertSchema(talentosCandidatesTable).omit({ appliedAt: true });
export const insertTalentosAssessmentSchema = createInsertSchema(talentosAssessmentsTable);
export const insertTalentosKnowledgeSourceSchema = createInsertSchema(talentosKnowledgeSourcesTable).omit({ updatedAt: true });
export const insertTalentosAutomationSchema = createInsertSchema(talentosAutomationsTable);
export const insertTalentosActivityEventSchema = createInsertSchema(talentosActivityEventsTable).omit({ occurredAt: true });
export const insertTalentosDashboardMetricsSchema = createInsertSchema(talentosDashboardMetricsTable);
export const insertTalentosFunnelStageSchema = createInsertSchema(talentosFunnelStagesTable);

export type InsertTalentosWorkspace = z.infer<typeof insertTalentosWorkspaceSchema>;
export type TalentosWorkspace = typeof talentosWorkspacesTable.$inferSelect;