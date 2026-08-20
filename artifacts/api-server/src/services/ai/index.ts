import { OpenAiProvider } from "./openai-provider.js";
import type { LlmProvider } from "./provider.js";
import { CandidateEvaluator } from "./candidate-evaluator.js";
import { RagService } from "./rag-service.js";

let cachedProvider: LlmProvider | null = null;

export function createLlmProvider(): LlmProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  cachedProvider = new OpenAiProvider({
    apiKey,
    model: process.env.OPENAI_MODEL,
  });

  return cachedProvider;
}

export function createCandidateEvaluator() {
  return new CandidateEvaluator(createLlmProvider());
}

export function createRagService() {
  return new RagService(createLlmProvider());
}
