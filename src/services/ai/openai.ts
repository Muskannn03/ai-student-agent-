import OpenAI from 'openai';
import { env } from '@/lib/env';
import { getPromptForRole } from './prompts';
import { AgentRole } from './agent-types';

let openaiClientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!env.isOpenAIConfigured) {
    return null;
  }
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClientInstance;
}

export interface GenerateChatOptions {
  prompt: string;
  role?: AgentRole;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  courseContext?: string;
}

export interface ChatResponseResult {
  content: string;
  isSimulated: boolean;
  model: string;
  tokensUsed?: number;
}

/**
 * Generate a response using OpenAI or fallback to academic simulation
 */
export async function generateStudentAgentResponse(
  options: GenerateChatOptions
): Promise<ChatResponseResult> {
  const { prompt, role = 'academic_tutor', history = [], courseContext } = options;
  const client = getOpenAIClient();

  if (!client) {
    // Intelligent academic simulation fallback when API key is not yet configured
    const simulatedAnswers: Record<string, string> = {
      default: `### Academic Assistant Analysis

I received your prompt: **"${prompt}"**

*Note: OpenAI API key is currently not configured in \`.env.local\`. This is an offline agent simulation demonstrating the UI & agent response pipeline.*

**Next Steps & Recommendations:**
1. **Key Concept Breakdown**: Break down the topic into fundamental definitions, core algorithms, and edge cases.
2. **Actionable Study Task**: Schedule a 45-minute focused session with active recall and practice problems.
3. **Suggested Query**: Try asking *"Can you create a 3-day revision plan for CS301?"* or *"Explain Dijkstra algorithm step-by-step."*

*Add your \`OPENAI_API_KEY\` to \`.env.local\` to activate live GPT-4o reasoning.*`,
    };

    return {
      content: simulatedAnswers.default,
      isSimulated: true,
      model: 'simulator-mode',
    };
  }

  try {
    const systemPrompt = getPromptForRole(role);
    const contextualSystemPrompt = courseContext
      ? `${systemPrompt}\n\nActive Course Context: ${courseContext}`
      : systemPrompt;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: contextualSystemPrompt },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      { role: 'user', content: prompt },
    ];

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    });

    const responseText = response.choices[0]?.message?.content || 'No response generated.';

    return {
      content: responseText,
      isSimulated: false,
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
    };
  } catch (error) {
    console.error('[OpenAI Service Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown AI service error';

    return {
      content: `### AI Service Notice\n\nUnable to complete request with OpenAI API: **${errorMessage}**.\n\nPlease check your \`OPENAI_API_KEY\` and quota in \`.env.local\`.`,
      isSimulated: true,
      model: 'error-fallback',
    };
  }
}
