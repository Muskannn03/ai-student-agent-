// ==========================================
// AI Provider Factory & Exports
// Dynamically resolves AIProvider based on AI_PROVIDER in environment
// ==========================================

import { AIProvider } from './types';
import { OllamaProvider } from './ollamaProvider';
import { OpenAIProvider } from './openaiProvider';

export * from './types';
export * from './ollamaProvider';
export * from './openaiProvider';

let activeProvider: AIProvider | null = null;
let currentProviderType: string | null = null;

export function getAIProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || 'ollama').toLowerCase();

  // Return cached singleton if provider type has not changed
  if (activeProvider && currentProviderType === providerType) {
    return activeProvider;
  }

  if (providerType === 'ollama') {
    activeProvider = new OllamaProvider();
  } else if (providerType === 'openai') {
    activeProvider = new OpenAIProvider();
  } else {
    console.warn(`[AIProvider] Unknown AI_PROVIDER '${providerType}'. Defaulting to 'ollama'.`);
    activeProvider = new OllamaProvider();
  }

  currentProviderType = providerType;
  return activeProvider;
}
