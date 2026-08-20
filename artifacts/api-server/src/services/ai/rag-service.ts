import { z } from "zod";
import type { LlmProvider } from "./provider.js";
import { retrieveKnowledgeSources } from "./retrieval.js";

export const RagQueryResponseSchema = z.object({
  answer: z.string().min(10),
  sources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    kind: z.string(),
  })).min(1),
});

export type RagQueryResponse = z.infer<typeof RagQueryResponseSchema>;

export class RagService {
  constructor(private readonly provider: LlmProvider) {}

  async query(options: { workspaceId: string; query: string }): Promise<RagQueryResponse> {
    const chunks = await retrieveKnowledgeSources({
      workspaceId: options.workspaceId,
      query: options.query,
      limit: 5,
    });

    if (chunks.length === 0) {
      return {
        answer: "The available knowledge does not answer this question.",
        sources: [],
      };
    }

    const context = chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.name} (${chunk.kind})\n${chunk.content}`)
      .join("\n\n");

    const prompt = [
      "Answer the question using ONLY the provided knowledge context.",
      "If the context does not contain enough information, say that the available knowledge does not answer the question.",
      "Include source references like [1], [2] when relevant.",
      "",
      "## Knowledge Context",
      context,
      "",
      "## Question",
      options.query,
      "",
      "Respond with JSON matching this schema:",
      '{"answer": "string", "sources": [{"id": "string", "name": "string", "kind": "string"}]}',
    ].join("\n");

    const result = await this.provider.generateStructured({
      prompt,
      schema: RagQueryResponseSchema,
    });

    return result;
  }
}
