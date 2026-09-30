// ==========================================
// OpenAI AI Provider Implementation
// Server-side OpenAI integration for GPT-4o-mini & text-embedding-3-small
// Preserved for optional future use when AI_PROVIDER="openai"
// ==========================================

import OpenAI from 'openai';
import { AIProvider, ProviderChatOptions, ProviderChatResult } from './types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  readonly chatModel: string;
  readonly embeddingModel: string;
  private client: OpenAI | null = null;

  constructor() {
    this.chatModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.embeddingModel = 'text-embedding-3-small';
  }

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your-')) {
      throw new Error('OPENAI_API_KEY is missing or invalid in .env.local.');
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
      });
    }

    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    const apiKey = process.env.OPENAI_API_KEY;
    return Boolean(apiKey && apiKey.startsWith('sk-'));
  }

  async embed(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(1536).fill(0);
    }

    const client = this.getClient();
    const response = await client.embeddings.create({
      model: this.embeddingModel,
      input: text.slice(0, 8000),
    });

    const vector = response.data[0]?.embedding;
    if (!vector || !Array.isArray(vector)) {
      throw new Error('OpenAI returned invalid embedding response format.');
    }

    return vector;
  }

  async chat(options: ProviderChatOptions): Promise<ProviderChatResult> {
    const client = this.getClient();
    const modelToUse = options.model || this.chatModel;

    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      options.messages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            tool_call_id: m.tool_call_id || '',
            content: m.content || '',
          };
        }
        if (m.role === 'assistant') {
          const astMsg: any = { role: 'assistant', content: m.content || '' };
          if (m.tool_calls) {
            astMsg.tool_calls = m.tool_calls;
          }
          return astMsg;
        }
        if (m.role === 'system') {
          return { role: 'system' as const, content: m.content || '' };
        }
        return { role: 'user' as const, content: m.content || '' };
      });

    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 1800,
      tools: options.tools && options.tools.length > 0 && options.toolChoice !== 'none'
        ? (options.tools as any)
        : undefined,
      tool_choice: options.toolChoice === 'none' ? 'none' : 'auto',
    });

    const choice = completion.choices[0];
    const message = choice?.message;

    if (!message) {
      throw new Error('Received empty response from OpenAI chat completion.');
    }

    let toolCalls: ProviderChatResult['toolCalls'] = undefined;
    if (message.tool_calls && message.tool_calls.length > 0) {
      toolCalls = message.tool_calls
        .filter((tc: any) => tc.type === 'function' && tc.function)
        .map((tc: any) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));
    }

    return {
      message: message.content || '',
      toolCalls,
      tokensUsed: completion.usage?.total_tokens,
      model: completion.model || modelToUse,
    };
  }
}
