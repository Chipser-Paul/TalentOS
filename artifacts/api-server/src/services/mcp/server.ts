import { Tools } from "../tools/index.js";
import type { ToolDefinition, ToolContext } from "../tools/tool.js";
import { z } from "zod";

const CallToolInputSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

const ToolResultSchema = z.object({
  content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
});

type McpMessage =
  | { type: "request"; id: string; method: string; params?: unknown }
  | { type: "response"; id: string; result: unknown }
  | { type: "error"; id: string; error: { message: string } };

export class TalentOsMcpServer {
  private readonly tools: Record<string, ToolDefinition<unknown, unknown>>;

  constructor(tools: ToolDefinition<unknown, unknown>[]) {
    this.tools = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  }

  async handleMessage(message: string, context: ToolContext): Promise<string> {
    let parsed: McpMessage;
    try {
      parsed = JSON.parse(message) as McpMessage;
    } catch {
      return this.jsonResponse(this.randomId(), null, { code: -32700, message: "Parse error" });
    }

    if (parsed.type === "request") {
      return this.handleRequest(parsed, context);
    }

    return this.jsonResponse(this.randomId(), null, { code: -32600, message: "Invalid request" });
  }

  private async handleRequest(message: { id: string; method: string; params?: unknown }, context: ToolContext): Promise<string> {
    if (message.method === "initialize") {
      return this.jsonResponse(message.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "talentos-mcp", version: "0.1.0" },
      });
    }

    if (message.method === "tools/list") {
      return this.jsonResponse(message.id, {
        tools: Tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      });
    }

    if (message.method === "tools/call") {
      const params = (message.params ?? {}) as { name: string; arguments?: Record<string, unknown> };
      const tool = this.tools[params.name];
      if (!tool) {
        return this.jsonResponse(message.id, null, { code: -32601, message: "Tool not found" });
      }

      const parsed = CallToolInputSchema.safeParse({ name: params.name, arguments: params.arguments ?? {} });
      if (!parsed.success) {
        return this.jsonResponse(message.id, null, { code: -32602, message: "Invalid arguments" });
      }

      try {
        const result = await tool.execute(parsed.data.arguments, context);
        return this.jsonResponse(message.id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
        });
      } catch (error) {
        return this.jsonResponse(message.id, {
          content: [{ type: "text", text: JSON.stringify({ error: error instanceof Error ? error.message : "Tool execution failed" }) }],
        });
      }
    }

    return this.jsonResponse(message.id, null, { code: -32601, message: "Method not found" });
  }

  private jsonResponse(id: string, result: unknown, error?: { code: number; message: string }): string {
    const payload: Record<string, unknown> = { jsonrpc: "2.0", id, result };
    if (error) {
      payload.error = error;
      delete payload.result;
    }
    return JSON.stringify(payload);
  }

  private randomId(): string {
    return Math.random().toString(36).slice(2, 11);
  }
}
