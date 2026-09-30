// ==========================================
// AI Academic Agent - Core Agent Service
// Implements autonomous tool-calling loop using Llama 3.2
// Decides dynamically whether a tool is required
// ==========================================

import {
  AgentInput,
  AgentOutput,
  ToolCallExecutionSummary,
} from './types';
import {
  getToolDefinitionsForModel,
  executeAgentTool,
  getToolByName,
} from './toolRegistry';
import { getAIProvider, ProviderChatMessage } from '@/lib/ai/providers';

/**
 * Maximum tool execution iterations permitted per user turn.
 * Protects against infinite tool recursion and runaway execution.
 */
const MAX_TOOL_ITERATIONS = 5;

/**
 * Understand user intent and decide whether an academic tool is required.
 * Strictly prevents unnecessary tool calls for general conceptual/academic questions.
 */
export function decideToolRequirement(userMessage: string): {
  requiresTool: boolean;
  detectedTool?: string;
  reason: string;
} {
  const lower = userMessage.toLowerCase().trim();

  // 1. Uploaded Notes / Document Retrieval Intent
  const hasNotesIntent =
    lower.includes('uploaded note') ||
    lower.includes('uploaded notes') ||
    lower.includes('my note') ||
    lower.includes('my notes') ||
    lower.includes('in the note') ||
    lower.includes('in the notes') ||
    lower.includes('from the note') ||
    lower.includes('from my note') ||
    lower.includes('course note') ||
    lower.includes('lecture note') ||
    lower.includes('uploaded document') ||
    lower.includes('uploaded pdf') ||
    lower.includes('in the document') ||
    lower.includes('from the document') ||
    lower.includes('according to my note') ||
    lower.includes('according to my notes') ||
    lower.includes('according to the note') ||
    lower.includes('according to the notes') ||
    lower.includes('using my note') ||
    lower.includes('using my notes') ||
    lower.includes('using my uploaded note') ||
    lower.includes('using my uploaded notes') ||
    lower.includes('in my uploaded note') ||
    lower.includes('in my uploaded notes') ||
    lower.includes('chp ') ||
    lower.includes('chapter ') ||
    lower.includes('syllabus');

  if (hasNotesIntent) {
    return {
      requiresTool: true,
      detectedTool: 'searchNotes',
      reason: 'User explicitly requested information from personal uploaded course notes or documents.',
    };
  }

  // 2. Upcoming Deadlines Intent
  const hasDeadlineIntent =
    lower.includes('deadline') ||
    lower.includes('deadlines') ||
    lower.includes('due date') ||
    lower.includes('due dates') ||
    lower.includes('due this week') ||
    lower.includes('due soon') ||
    lower.includes('due today') ||
    lower.includes('due tomorrow') ||
    lower.includes('what is due') ||
    lower.includes('what do i have due');

  if (hasDeadlineIntent) {
    return {
      requiresTool: true,
      detectedTool: 'getUpcomingDeadlines',
      reason: 'User requested upcoming academic deadlines or due dates.',
    };
  }

  // 3. Assignments & Coursework Intent
  const hasAssignmentIntent =
    lower.includes('assignment') ||
    lower.includes('assignments') ||
    lower.includes('homework') ||
    lower.includes('coursework') ||
    lower.includes('pending task') ||
    lower.includes('pending tasks') ||
    lower.includes('my tasks');

  if (hasAssignmentIntent) {
    return {
      requiresTool: true,
      detectedTool: 'getAssignments',
      reason: 'User requested personal academic assignments or coursework tasks.',
    };
  }

  // 4. Student Profile Intent
  const hasProfileIntent =
    lower.includes('my profile') ||
    lower.includes('student profile') ||
    lower.includes('academic profile') ||
    lower.includes('my degree') ||
    lower.includes('my course') ||
    lower.includes('my semester') ||
    lower.includes('my skills') ||
    lower.includes('my career goal') ||
    lower.includes('who am i');

  if (hasProfileIntent) {
    return {
      requiresTool: true,
      detectedTool: 'getStudentProfile',
      reason: 'User requested their personal student profile information.',
    };
  }

  // 5. Study Plan & Scheduling Intent
  const hasPlanIntent =
    lower.includes('study plan') ||
    lower.includes('revision plan') ||
    lower.includes('study sprint') ||
    lower.includes('plan study') ||
    lower.includes('schedule study') ||
    lower.includes('schedule a study') ||
    lower.includes('create a study') ||
    lower.includes('create a revision') ||
    lower.includes('plan my study') ||
    lower.includes('study session');

  if (hasPlanIntent) {
    return {
      requiresTool: true,
      detectedTool: 'createStudyPlan',
      reason: 'User requested creating or scheduling a study session plan.',
    };
  }

  // 6. Default: General Knowledge / Theory Question -> No tool required
  return {
    requiresTool: false,
    reason: 'General academic, conceptual, or programming query requiring no database tools.',
  };
}

/**
 * Build concise, explicit system prompt instructing Llama 3.2 on
 * academic mentorship, tool decision rules, and strict grounding.
 */
function buildAgentSystemPrompt(context: AgentInput['context']): string {
  const studentName = context.studentName || 'Student';
  const course = context.course || 'Computer Science';
  const semester = context.semester ? `Semester ${context.semester}` : '';

  return `You are the AI Student Agent, an intelligent academic co-pilot for ${studentName} (${course}${semester ? `, ${semester}` : ''}).

You are equipped with specialized academic tools:
- searchNotes: Search the student's uploaded personal PDF lecture notes and course documents using semantic vector retrieval.
- getAssignments: Retrieve coursework assignments and tasks from PostgreSQL.
- getUpcomingDeadlines: Retrieve upcoming assignment deadlines for the next N days (default 7 days).
- getStudentProfile: Retrieve the current student's degree, skills, and academic profile.
- createStudyPlan: Schedule and save a study session or revision plan in the student's calendar.

DECISION MAKING & TOOL USAGE RULES:
1. GENERAL KNOWLEDGE QUESTIONS:
   If the student asks a general academic, conceptual, algorithmic, or programming question (e.g. "Explain binary search", "What is Big-O notation?", "How does backpropagation work?", "Explain Dijkstra algorithm"):
   - Do NOT call any database tools.
   - Answer directly and clearly using your academic knowledge.
   
2. UPLOADED NOTES (searchNotes):
   - ONLY call searchNotes when the student explicitly asks about their uploaded notes, course materials, uploaded documents, or mentions specific chapters/notes (e.g. "Explain binary search using my uploaded notes", "What does CHP 1 say?", "According to my notes on web tech...").
   - If searchNotes returns an empty list or 0 chunks, you must NOT invent or hallucinate course material. Honestly state: "I couldn't find relevant information in your uploaded notes." You may then offer a general explanation if helpful, clearly clarifying that it is not from their uploaded notes.
   - When citing information from searchNotes, cite the document title and chunk number.

3. ACADEMIC ASSIGNMENTS & DEADLINES:
   - Call getAssignments when the student asks to view, check, or list their assignments or homework (e.g. "Show my pending assignments").
   - Call getUpcomingDeadlines when the student asks about deadlines, due dates, or what is due soon or this week (e.g. "What deadlines do I have this week?").

4. STUDENT PROFILE:
   - Call getStudentProfile when the student asks about their profile, enrolled course, semester, skills, or career goals (e.g. "What is my student profile?").

5. STUDY PLAN GENERATION:
   - Call createStudyPlan when the student asks to plan, schedule, or create a study session or revision sprint (e.g. "Create a 2 hour study plan for algorithms tomorrow").

6. Do NOT call tools unnecessarily when general explanations or conceptual answers are requested.`;
}

/**
 * Execute the autonomous academic agent.
 */
export async function runAcademicAgent(input: AgentInput): Promise<AgentOutput> {
  const { userMessage, history = [], context } = input;

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('User message is required and cannot be empty.');
  }

  const trimmedMessage = userMessage.trim();
  console.log(`[AGENT] User request received: "${trimmedMessage.slice(0, 60)}${trimmedMessage.length > 60 ? '...' : ''}"`);

  const provider = getAIProvider();

  // Availability check
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    if (provider.name === 'ollama') {
      throw new Error('Ollama is not running. Please start Ollama and try again.');
    }
  }

  const systemPrompt = buildAgentSystemPrompt(context);
  const intent = decideToolRequirement(trimmedMessage);
  console.log(`[AGENT] Intent decision: requiresTool=${intent.requiresTool} (${intent.reason})`);

  // Provide tools only when personal academic tools are required
  const availableTools = intent.requiresTool ? getToolDefinitionsForModel() : undefined;
  const toolCallsExecuted: ToolCallExecutionSummary[] = [];

  // Build message thread for provider
  const messages: ProviderChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    })),
    { role: 'user', content: trimmedMessage },
  ];

  let loopStep = 0;
  let finalMessage = '';

  while (loopStep < MAX_TOOL_ITERATIONS) {
    loopStep++;
    const isLastAllowedStep = loopStep === MAX_TOOL_ITERATIONS;

    // Send request to Llama 3.2
    const completion = await provider.chat({
      model: provider.chatModel,
      messages,
      tools: isLastAllowedStep ? undefined : availableTools,
      toolChoice: isLastAllowedStep || !intent.requiresTool ? 'none' : 'auto',
      temperature: 0.3, // Lower temperature for disciplined tool calling & factual responses
      maxTokens: 1800,
    });

    const toolCalls = completion.toolCalls;

    // Case 1: Model did not request any tools -> Final response is ready
    if (!toolCalls || toolCalls.length === 0) {
      finalMessage = completion.message?.trim() || '';
      console.log(`[AGENT] Final response generated (after ${loopStep} step${loopStep > 1 ? 's' : ''})`);
      break;
    }

    // Case 2: Model decided to call one or more tools
    messages.push({
      role: 'assistant',
      content: completion.message || '',
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const rawArgs = toolCall.function.arguments;

      // Validate tool
      const tool = getToolByName(toolName);
      if (!tool) {
        console.warn(`[AGENT] Warning: Model requested unknown tool "${toolName}"`);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `Tool "${toolName}" does not exist. Available tools: searchNotes, getAssignments, getUpcomingDeadlines, getStudentProfile, createStudyPlan.`,
          }),
        });
        continue;
      }

      // Execute tool securely server-side
      const execution = await executeAgentTool(toolName, rawArgs, context);

      toolCallsExecuted.push({
        name: toolName,
        arguments: typeof rawArgs === 'string' ? safeJsonParse(rawArgs) : rawArgs,
        durationMs: execution.durationMs,
        success: execution.success,
      });

      // Format payload for model
      const toolPayload = execution.success
        ? execution.result
        : { error: execution.error || 'Tool execution encountered an error.' };

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolPayload),
      });
    }

    // Loop continues: Llama 3.2 will receive tool results and synthesize final answer
  }

  if (!finalMessage) {
    finalMessage = 'I have processed your academic request.';
    console.log('[AGENT] Final response generated (fallback)');
  }

  return {
    message: finalMessage,
    toolCallsExecuted,
    model: provider.chatModel,
    isSimulated: false,
    iterations: loopStep,
  };
}

function safeJsonParse(str: string): Record<string, any> {
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}
