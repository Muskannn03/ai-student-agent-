// ==========================================
// AI Agent Tools - Core Types & Interfaces
// ==========================================

export interface ToolExecutionContext {
  userId?: string;
  userEmail?: string;
  studentName?: string;
  [key: string]: any;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[] | number[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: any;
}

export interface ToolParametersSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface AgentTool<TArgs = any, TResult = any> {
  name: string;
  description: string;
  parameters: ToolParametersSchema;
  execute: (args: TArgs, context: ToolExecutionContext) => Promise<TResult> | TResult;
}

export interface ToolCallLog {
  id?: string;
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  durationMs: number;
  timestamp: string;
}
