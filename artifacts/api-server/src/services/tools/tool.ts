export interface ToolDefinition<Input, Output> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute(input: Input, context: { workspaceId: string }): Promise<Output>;
}

export interface ToolContext {
  workspaceId: string;
}
