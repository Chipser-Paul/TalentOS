import { z } from "zod";

export type LlmProviderName = "openai";

export interface LlmProvider {
  name: LlmProviderName;
  generateStructured<T extends z.ZodType>(options: {
    prompt: string;
    schema: T;
    model?: string;
  }): Promise<z.infer<T>>;
}

export interface LlmProviderConfig {
  apiKey: string;
  model?: string;
}
