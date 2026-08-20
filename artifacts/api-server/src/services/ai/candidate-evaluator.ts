import type { LlmProvider } from "./provider.js";
import { z } from "zod";

export const CandidateEvaluationSchema = z.object({
  overallScore: z.coerce.number().int().min(0).max(100),
  skillsScore: z.coerce.number().int().min(0).max(100),
  experienceScore: z.coerce.number().int().min(0).max(100),
  educationScore: z.coerce.number().int().min(0).max(100),
  strengths: z.array(z.string().min(1)).min(1),
  gaps: z.array(z.string().min(1)),
  recommendation: z.enum(["strong_match", "potential_match", "weak_match"]),
  summary: z.string().min(10),
});

export type CandidateEvaluation = z.infer<typeof CandidateEvaluationSchema>;

export interface CandidateEvaluationInput {
  candidate: {
    name: string;
    role: string;
    location: string;
    skills: string[];
    status: string;
  };
  job: {
    title: string;
    department: string;
    location: string;
    employmentType: string;
    status: string;
  };
}

export class CandidateEvaluator {
  constructor(private readonly provider: LlmProvider) {}

  async evaluate(input: CandidateEvaluationInput): Promise<CandidateEvaluation> {
    const prompt = [
      `Evaluate the fit between the candidate and the job using ONLY the information provided below.`,
      ``,
      `## Candidate`,
      `- Name: ${input.candidate.name}`,
      `- Desired role: ${input.candidate.role}`,
      `- Location: ${input.candidate.location}`,
      `- Skills: ${input.candidate.skills.join(", ")}`,
      `- Status: ${input.candidate.status}`,
      ``,
      `## Job`,
      `- Title: ${input.job.title}`,
      `- Department: ${input.job.department}`,
      `- Location: ${input.job.location}`,
      `- Employment type: ${input.job.employmentType}`,
      `- Status: ${input.job.status}`,
      ``,
      `## Instructions`,
      `- Score each dimension from 0 to 100.`,
      `- strengths: explicit evidence only.`,
      `- gaps: missing or weak areas only.`,
      `- recommendation: strong_match if overall >= 75, potential_match if >= 50, otherwise weak_match.`,
      `- summary: 1-3 sentences for a recruiter.`,
      ``,
      `Respond with JSON that matches this schema:`,
      `{"overallScore": number, "skillsScore": number, "experienceScore": number, "educationScore": number, "strengths": string[], "gaps": string[], "recommendation": "strong_match" | "potential_match" | "weak_match", "summary": string}`,
    ].join("\n");

    return this.provider.generateStructured({
      prompt,
      schema: CandidateEvaluationSchema,
    });
  }
}
