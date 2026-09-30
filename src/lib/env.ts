// ==========================================
// Environment Variable Validation & Helpers
// ==========================================

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Provider: 'ollama' | 'openai'
  AI_PROVIDER: (process.env.AI_PROVIDER || 'ollama') as 'ollama' | 'openai',

  // Ollama Configuration
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
  OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',

  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // App Config
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AISA-AI Student Agent',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Feature Flags & Checks
  get isDatabaseConfigured(): boolean {
    return Boolean(this.DATABASE_URL && !this.DATABASE_URL.includes('your-'));
  },

  get isOllamaConfigured(): boolean {
    return this.AI_PROVIDER === 'ollama';
  },

  get isOpenAIConfigured(): boolean {
    return Boolean(this.OPENAI_API_KEY && this.OPENAI_API_KEY.startsWith('sk-'));
  },
};

/**
 * Validate required environment variables at runtime with helpful warnings
 */
export function validateServerEnv(): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!env.DATABASE_URL) {
    warnings.push('DATABASE_URL is not set in .env.local. Falling back to in-memory mock student data.');
  }

  if (env.AI_PROVIDER === 'openai' && !env.isOpenAIConfigured) {
    warnings.push('OPENAI_API_KEY is not set or placeholder in .env.local while AI_PROVIDER=openai.');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

