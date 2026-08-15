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

const router: IRouter = Router();

const dashboardSummary = {
  activeJobs: 8,
  totalCandidates: 248,
  technicalAssessments: 84,
  interviewsScheduled: 31,
  shortlisted: 12,
  averageMatch: 82,
};

const activity = [
  {
    id: "activity-1",
    type: "screening",
    title: "AI screening completed",
    description: "42 new applications were scored for Full-Stack Engineer.",
    occurredAt: "2026-08-15T08:42:00.000Z",
    actor: "TalentOS Agent",
  },
  {
    id: "activity-2",
    type: "assessment",
    title: "Assessment submitted",
    description: "Mariam Eze submitted the Node.js API challenge.",
    occurredAt: "2026-08-15T07:18:00.000Z",
    actor: "Mariam Eze",
  },
  {
    id: "activity-3",
    type: "shortlist",
    title: "Candidate shortlisted",
    description: "Paul Fokoua moved to the hiring manager review stage.",
    occurredAt: "2026-08-14T16:05:00.000Z",
    actor: "Ada Nwosu",
  },
  {
    id: "activity-4",
    type: "interview",
    title: "Interview scheduled",
    description: "Architecture interview confirmed for Friday at 10:00.",
    occurredAt: "2026-08-14T13:30:00.000Z",
    actor: "TalentOS Agent",
  },
];

const jobs = [
  {
    id: "job-1",
    title: "Senior Full-Stack Engineer",
    department: "Product Engineering",
    location: "Remote · Africa",
    employmentType: "full_time",
    status: "open",
    applications: 248,
    shortlisted: 12,
    createdAt: "2026-07-28T09:00:00.000Z",
  },
  {
    id: "job-2",
    title: "AI Platform Engineer",
    department: "Applied Intelligence",
    location: "Lagos · Hybrid",
    employmentType: "full_time",
    status: "open",
    applications: 96,
    shortlisted: 8,
    createdAt: "2026-08-02T09:00:00.000Z",
  },
  {
    id: "job-3",
    title: "Product Designer",
    department: "Design",
    location: "Remote · Worldwide",
    employmentType: "contract",
    status: "paused",
    applications: 74,
    shortlisted: 5,
    createdAt: "2026-07-19T09:00:00.000Z",
  },
];

const candidates = [
  {
    id: "candidate-1",
    name: "Paul Fokoua",
    role: "Senior Full-Stack Engineer",
    location: "Yaoundé, Cameroon",
    matchScore: 94,
    technicalScore: 91,
    interviewScore: 88,
    status: "shortlisted",
    skills: ["React", "Node.js", "PostgreSQL", "TypeScript"],
    appliedAt: "2026-08-14T09:12:00.000Z",
  },
  {
    id: "candidate-2",
    name: "Mariam Eze",
    role: "Senior Full-Stack Engineer",
    location: "Lagos, Nigeria",
    matchScore: 87,
    technicalScore: 84,
    interviewScore: 91,
    status: "assessment",
    skills: ["TypeScript", "FastAPI", "Redis", "Docker"],
    appliedAt: "2026-08-13T11:20:00.000Z",
  },
  {
    id: "candidate-3",
    name: "Daniel Okoro",
    role: "AI Platform Engineer",
    location: "Accra, Ghana",
    matchScore: 82,
    technicalScore: 79,
    interviewScore: 84,
    status: "interview",
    skills: ["Python", "RAG", "OpenAI", "AWS"],
    appliedAt: "2026-08-12T15:40:00.000Z",
  },
  {
    id: "candidate-4",
    name: "Amina Bello",
    role: "Product Designer",
    location: "Abuja, Nigeria",
    matchScore: 72,
    technicalScore: 69,
    interviewScore: 76,
    status: "screening",
    skills: ["Figma", "Research", "Prototyping"],
    appliedAt: "2026-08-11T10:05:00.000Z",
  },
];

const assessments = [
  {
    id: "assessment-1",
    title: "Production API Architecture",
    role: "Senior Full-Stack Engineer",
    submissions: 38,
    completionRate: 76,
    averageScore: 81,
    status: "active",
  },
  {
    id: "assessment-2",
    title: "RAG Pipeline Implementation",
    role: "AI Platform Engineer",
    submissions: 16,
    completionRate: 64,
    averageScore: 78,
    status: "active",
  },
  {
    id: "assessment-3",
    title: "Product Thinking Sprint",
    role: "Product Designer",
    submissions: 30,
    completionRate: 88,
    averageScore: 86,
    status: "draft",
  },
];

const knowledgeSources = [
  {
    id: "source-1",
    name: "Engineering hiring principles",
    kind: "policy",
    chunks: 42,
    updatedAt: "2026-08-12T10:30:00.000Z",
    status: "ready",
  },
  {
    id: "source-2",
    name: "Senior backend job description",
    kind: "job_description",
    chunks: 18,
    updatedAt: "2026-08-10T14:20:00.000Z",
    status: "ready",
  },
  {
    id: "source-3",
    name: "Technical interview playbook",
    kind: "interview_guide",
    chunks: 67,
    updatedAt: "2026-08-08T09:15:00.000Z",
    status: "processing",
  },
];

const automations = [
  {
    id: "automation-1",
    name: "New application screening",
    trigger: "When a new application arrives",
    steps: 5,
    runsThisMonth: 184,
    status: "active",
  },
  {
    id: "automation-2",
    name: "Assessment reminder",
    trigger: "48 hours before assessment deadline",
    steps: 3,
    runsThisMonth: 62,
    status: "active",
  },
  {
    id: "automation-3",
    name: "Hiring manager handoff",
    trigger: "When candidate is shortlisted",
    steps: 4,
    runsThisMonth: 28,
    status: "paused",
  },
];

const funnel = [
  { label: "Visitors", count: 1000, conversionRate: 100 },
  { label: "Started application", count: 420, conversionRate: 42 },
  { label: "Completed", count: 310, conversionRate: 74 },
  { label: "AI screened", count: 180, conversionRate: 58 },
  { label: "Technical assessment", count: 70, conversionRate: 39 },
  { label: "Interview", count: 25, conversionRate: 36 },
  { label: "Hired", count: 8, conversionRate: 32 },
];

router.get("/dashboard/summary", (_req, res) => {
  res.json(GetDashboardSummaryResponse.parse(dashboardSummary));
});

router.get("/dashboard/activity", (_req, res) => {
  res.json(GetDashboardActivityResponse.parse(activity));
});

router.get("/jobs", (_req, res) => {
  res.json(ListJobsResponse.parse(jobs));
});

router.get("/candidates", (_req, res) => {
  res.json(ListCandidatesResponse.parse(candidates));
});

router.get("/assessments", (_req, res) => {
  res.json(ListAssessmentsResponse.parse(assessments));
});

router.get("/knowledge/sources", (_req, res) => {
  res.json(ListKnowledgeSourcesResponse.parse(knowledgeSources));
});

router.get("/automations", (_req, res) => {
  res.json(ListAutomationsResponse.parse(automations));
});

router.get("/analytics/funnel", (_req, res) => {
  res.json(GetAnalyticsFunnelResponse.parse(funnel));
});

export default router;