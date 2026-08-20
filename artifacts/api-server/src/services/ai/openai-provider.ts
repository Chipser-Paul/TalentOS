import type { LlmProvider, LlmProviderConfig } from "./provider.js";
import { z } from "zod";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";

  constructor(private readonly config: LlmProviderConfig) {}

  async generateStructured<T extends z.ZodType>(options: {
    prompt: string;
    schema: T;
    model?: string;
  }): Promise<z.infer<T>> {
    const model = options.model ?? this.config.model ?? "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are a hiring signal evaluator.",
              "Return ONLY valid JSON that matches the provided schema.",
              "Do not include markdown, explanations, or extra text.",
              "If information is missing, treat it as unknown rather than assuming the candidate has the skill or experience.",
            ].join(" "),
          },
          {
            role: "user",
            content: options.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("LLM returned an empty response");
    }

    const parsed = JSON.parse(content);
    return options.schema.parse(parsed);
  }
}
