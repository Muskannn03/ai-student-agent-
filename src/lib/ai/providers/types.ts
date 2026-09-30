// ==========================================
// AI Provider Abstraction - Types
// ==========================================

export interface ProviderChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string | Record<string, any>;
    };
  }>;
}

export interface ProviderToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

export interface ProviderChatOptions {
  model?: string;
  messages: ProviderChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ProviderToolDefinition[] | any[];
  toolChoice?: 'auto' | 'none';
  timeoutMs?: number;
  onChunk?: (chunk: string) => void;
}

export interface ProviderChatResult {
  message: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: Record<string, any> | string;
    };
  }>;
  tokensUsed?: number;
  model: string;
}

export interface AIProvider {
  readonly name: 'ollama' | 'openai';
  readonly chatModel: string;
  readonly embeddingModel: string;

  chat(options: ProviderChatOptions): Promise<ProviderChatResult>;
  embed(text: string): Promise<number[]>;
  isAvailable(): Promise<boolean>;
}
