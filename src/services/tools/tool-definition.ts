// ==========================================
// Tool Definition Architecture for AI Agent
// ==========================================

import { AgentToolDefinition } from '../ai/agent-types';

export type ToolRegistry = Map<string, AgentToolDefinition>;

export class AgentToolManager {
  private tools: ToolRegistry = new Map();

  registerTool(tool: AgentToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): AgentToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getOpenAIFunctionSchemas() {
    return this.listTools().map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: t.parameters.reduce(
            (acc, p) => {
              acc[p.name] = { type: p.type, description: p.description };
              return acc;
            },
            {} as Record<string, { type: string; description: string }>
          ),
          required: t.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    }));
  }
}
