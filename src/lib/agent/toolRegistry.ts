// ==========================================
// AI Academic Agent - Tool Registry
// Central registry for academic tools with safe server execution
// ==========================================

import { AgentTool, AgentContext } from './types';
import { searchNotesTool } from './tools/searchNotes';
import { getAssignmentsTool } from './tools/getAssignments';
import { getUpcomingDeadlinesTool } from './tools/getUpcomingDeadlines';
import { getStudentProfileTool } from './tools/getStudentProfile';
import { createStudyPlanTool } from './tools/createStudyPlan';

// Single registry containing registered tools for the academic agent
const TOOL_REGISTRY: Record<string, AgentTool> = {
  searchNotes: searchNotesTool,
  getAssignments: getAssignmentsTool,
  getUpcomingDeadlines: getUpcomingDeadlinesTool,
  getStudentProfile: getStudentProfileTool,
  createStudyPlan: createStudyPlanTool,
};

/**
 * Returns an array of all registered AgentTool instances.
 */
export function getRegisteredTools(): AgentTool[] {
  return Object.values(TOOL_REGISTRY);
}

/**
 * Retrieves a specific registered tool by name.
 */
export function getToolByName(name: string): AgentTool | undefined {
  return TOOL_REGISTRY[name];
}

/**
 * Converts registered tools into the JSON Schema format expected by
 * OllamaProvider.chat() (Ollama /api/chat tools format).
 */
export function getToolDefinitionsForModel() {
  return getRegisteredTools().map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
}

/**
 * Executes a registered tool securely server-side.
 * 1. Verifies that the requested tool exists.
 * 2. Parses and validates arguments safely.
 * 3. Executes the tool within the verified AgentContext.
 * 4. Measures execution time.
 * 5. Emits safe server-side logs.
 */
export async function executeAgentTool(
  toolName: string,
  rawArgs: Record<string, any> | string,
  context: AgentContext
): Promise<ToolExecutionResponse> {
  const tool = getToolByName(toolName);
  if (!tool) {
    return {
      success: false,
      error: `Tool "${toolName}" is not registered in the agent system.`,
      durationMs: 0,
    };
  }

  // Parse arguments if string
  let parsedArgs: Record<string, any> = {};
  if (typeof rawArgs === 'string') {
    try {
      parsedArgs = JSON.parse(rawArgs);
    } catch {
      parsedArgs = { raw: rawArgs };
    }
  } else if (rawArgs && typeof rawArgs === 'object') {
    parsedArgs = rawArgs;
  }

  const start = Date.now();
  console.log(`[TOOL] Executing: ${toolName}`);

  try {
    const result = await tool.execute(parsedArgs, context);
    const durationMs = Date.now() - start;
    console.log(`[TOOL] Completed: ${toolName}`);
    console.log(`[TOOL] Duration: ${durationMs}ms`);

    return {
      success: true,
      result,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - start;
    console.error(`[TOOL] Failed: ${toolName} (${durationMs}ms):`, error?.message || error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution encountered an error.',
      durationMs,
    };
  }
}
