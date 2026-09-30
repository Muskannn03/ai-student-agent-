// ==========================================
// Ollama AI Provider Implementation
// Pure server-side connection to local Ollama runtime
// Supports llama3.2 chat & nomic-embed-text embeddings
// ==========================================

import { AIProvider, ProviderChatOptions, ProviderChatResult } from './types';

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama' as const;
  readonly baseUrl: string;
  readonly chatModel: string;
  readonly embeddingModel: string;
  private readonly defaultTimeoutMs = 45000;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this.chatModel = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
  }

  /**
   * Check if the Ollama service is reachable locally
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate vector embeddings using Ollama's /api/embed endpoint.
   * Model: nomic-embed-text (returns 768-dimensional normalized vectors)
   */
  async embed(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(768).fill(0);
    }

    const endpoint = `${this.baseUrl}/api/embed`;

    // Explicit timeout for Ollama embedding request (30 seconds to accommodate model load)
    const timeoutMs = 30000;
    const controller = new AbortController();
    let isTimedOut = false;
    const timer = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      console.log('[EMBEDDING] Ollama request started');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text.slice(0, 8000), // Max context length for nomic-embed-text
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama embed error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('[EMBEDDING] Ollama response received');

      let vector: number[] | null = null;
      // Ollama /api/embed returns { embeddings: [[...]] }
      if (Array.isArray(data.embeddings) && data.embeddings.length > 0) {
        vector = data.embeddings[0];
      } else if (Array.isArray(data.embedding)) {
        // Legacy fallback: { embedding: [...] }
        vector = data.embedding;
      }

      if (!vector) {
        throw new Error('Ollama embed endpoint returned an unexpected response structure.');
      }

      console.log(`[EMBEDDING] vector length = ${vector.length}`);
      return vector;
    } catch (error: any) {
      clearTimeout(timer);

      if (isTimedOut || error?.name === 'TimeoutError' || (error?.name === 'AbortError' && isTimedOut)) {
        throw new Error('Embedding generation timed out.');
      }

      console.error('[OllamaProvider] Embedding failed:', error?.message || error);

      if (this.isNetworkOrTimeoutError(error)) {
        throw new Error('Ollama is not running. Please start Ollama and try again.');
      }

      throw new Error(
        error instanceof Error ? error.message : 'Ollama embedding generation failed.'
      );
    }
  }

  /**
   * Generate chat responses via Ollama's /api/chat endpoint.
   * Model: llama3.2 (supports function calling/tools)
   */
  async chat(options: ProviderChatOptions): Promise<ProviderChatResult> {
    const endpoint = `${this.baseUrl}/api/chat`;
    const modelToUse = options.model || this.chatModel;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    try {
      const payload: Record<string, any> = {
        model: modelToUse,
        messages: options.messages.map((m) => {
          const item: Record<string, any> = {
            role: m.role,
            content: m.content || '',
          };
          if (m.tool_calls) {
            item.tool_calls = m.tool_calls;
          }
          return item;
        }),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.5,
          num_predict: options.maxTokens ?? 1800,
        },
      };

      if (options.tools && options.tools.length > 0 && options.toolChoice !== 'none') {
        payload.tools = options.tools;
      }

      console.log(`[OllamaProvider] Dispatching chat request to ${endpoint} (model: ${modelToUse})...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama chat returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const assistantMessage = data.message;

      if (!assistantMessage) {
        throw new Error('Ollama returned empty response message.');
      }

      const tokensUsed =
        (data.prompt_eval_count || 0) + (data.eval_count || 0);

      // Parse tool calls if returned by model
      let toolCalls: ProviderChatResult['toolCalls'] = undefined;
      if (Array.isArray(assistantMessage.tool_calls) && assistantMessage.tool_calls.length > 0) {
        toolCalls = assistantMessage.tool_calls.map((tc: any, idx: number) => ({
          id: tc.id || `call_${idx}_${Date.now()}`,
          type: 'function' as const,
          function: {
            name: tc.function?.name || '',
            arguments: tc.function?.arguments || {},
          },
        }));
      }

      return {
        message: assistantMessage.content || '',
        toolCalls,
        tokensUsed,
        model: data.model || modelToUse,
      };
    } catch (error: any) {
      console.error('[OllamaProvider] Chat request failed:', error?.message || error);

      if (this.isNetworkOrTimeoutError(error)) {
        throw new Error('Ollama is not running. Please start Ollama and try again.');
      }

      throw new Error(
        error instanceof Error ? error.message : 'Ollama chat generation failed.'
      );
    }
  }

  private isNetworkOrTimeoutError(error: any): boolean {
    if (!error) return false;
    const msg = String(error.message || '').toLowerCase();
    const name = String(error.name || '').toLowerCase();
    const code = String(error.code || error.cause?.code || '').toLowerCase();

    return (
      name === 'aborterror' ||
      name === 'timeouterror' ||
      code === 'econnrefused' ||
      code === 'und_err_connect_timeout' ||
      msg.includes('fetch failed') ||
      msg.includes('econnrefused') ||
      msg.includes('aborted') ||
      msg.includes('network') ||
      msg.includes('connection refused')
    );
  }
}
