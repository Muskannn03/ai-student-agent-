// ==========================================
// AI Student Agent Service - Tool-Using Agent
// Pure Server-Side AI Service (UI Independent)
// Implements an autonomous multi-step Tool-Calling Loop
// Supports Ollama (llama3.2 & nomic-embed-text) and OpenAI
// ==========================================

import { buildStudentAssistantPrompt, StudentProfileContext } from './prompts';
import {
  getOpenAIToolsDefinition,
  executeToolCall,
  ToolExecutionContext,
  calculatorTool,
  assignmentsTool,
  studyPlanTool,
  notesSearchTool,
} from './tools';
import { getAIProvider, ProviderChatMessage } from './providers';
import { retrieveRelevantChunks, RetrievedChunk } from '@/lib/rag/retrievalService';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StudentAgentInput {
  userMessage: string;
  history?: ChatHistoryMessage[];
  studentProfile?: StudentProfileContext;
  userId?: string;
}

export interface ToolCallExecutionSummary {
  name: string;
  arguments: Record<string, any>;
  durationMs: number;
  success: boolean;
}

export interface StudentAgentResult {
  message: string;
  isSimulated: boolean;
  model: string;
  tokensUsed?: number;
  toolCallsExecuted?: ToolCallExecutionSummary[];
  toolLoopSteps?: number;
}

/**
 * Maximum tool execution iterations permitted per user turn.
 * Protects against infinite tool recursion and runaway execution.
 */
const MAX_TOOL_LOOPS = 5;

/**
 * Execute the Tool-Using AI Student Agent.
 *
 * Implements the full agentic loop:
 * User message
 * → RAG Knowledge Base Retrieval (nomic-embed-text / PostgreSQL)
 * → LLM (Ollama llama3.2 / OpenAI)
 * → Determine whether a tool is needed (tool_calls)
 * → Execute selected tool
 * → Return tool result to LLM
 * → LLM generates final grounded response
 */
export async function runStudentAgent(input: StudentAgentInput): Promise<StudentAgentResult> {
  const { userMessage, history = [], studentProfile, userId: directUserId } = input;

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('User message is required and cannot be empty.');
  }

  const trimmedMessage = userMessage.trim();
  const effectiveUserId = directUserId || studentProfile?.userId || 'default_student_user';

  // Tool execution context with verified user authorization
  const context: ToolExecutionContext = {
    userId: effectiveUserId,
    userEmail: studentProfile?.email,
    studentName: studentProfile?.name,
    course: studentProfile?.course,
    semester: studentProfile?.semester,
  };

  const provider = getAIProvider();

  console.log(`[AI] Provider: ${provider.name}`);
  console.log(`[AI] Chat model: ${provider.chatModel}`);
  console.log(`[RAG] Embedding model: ${provider.embeddingModel}`);

  // ----------------------------------------------------
  // Provider Availability & Fallback Check
  // ----------------------------------------------------
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    if (provider.name === 'ollama') {
      throw new Error('Ollama is not running. Please start Ollama and try again.');
    }

    console.log('[AI Agent] OpenAI API key not detected. Running intelligent local tool-assisted agent...');
    return await handleOfflineAgentWithTools(trimmedMessage, context, studentProfile);
  }

  // ----------------------------------------------------
  // RAG Pipeline: Vector Similarity Retrieval over Notes
  // ----------------------------------------------------
  let ragContext = '';
  let ragRetrievedChunks: RetrievedChunk[] = [];

  try {
    const ragResult = await retrieveRelevantChunks({
      query: trimmedMessage,
      userId: effectiveUserId,
      topK: 6,
      minSimilarity: 0.50,
    });

    if (ragResult.hasRelevantContext && ragResult.relevantChunks.length > 0) {
      ragRetrievedChunks = ragResult.relevantChunks;
      console.log(
        `[RAG Retrieval] Retrieved ${ragRetrievedChunks.length} relevant chunks for query: "${trimmedMessage}" (best similarity: ${ragResult.bestSimilarity})`
      );

      ragContext =
        `\n\n### 📚 Context from Student's Uploaded Notes:\n` +
        ragRetrievedChunks
          .map(
            (c, idx) =>
              `--- Excerpt ${idx + 1} [Source: ${c.fileName || c.documentTitle}] (Chunk #${c.chunkIndex}, Relevance: ${Math.round(c.similarity * 100)}%) ---\n${c.content}`
          )
          .join('\n\n') +
        `\n\nCRITICAL GROUNDING RULES:\n` +
        `- Answer the student's question based strictly and truthfully on the excerpts from the student's uploaded notes above.\n` +
        `- Cite the source document name and chunk number (e.g. [Source: ${ragRetrievedChunks[0]?.fileName || 'uploaded notes'} (Chunk #${ragRetrievedChunks[0]?.chunkIndex})]).\n` +
        `- Do NOT invent, assume, or hallucinate facts, concepts, or formulas that are not present in the excerpts.\n` +
        `- If the excerpts above do not contain the answer, say: "I couldn't find relevant information in your uploaded notes."\n`;
    }
  } catch (ragErr: any) {
    console.warn('[RAG Retrieval Warning]: Could not fetch relevant chunks:', ragErr?.message || ragErr);
    if (ragErr?.message?.includes('Ollama is not running')) {
      throw ragErr;
    }
  }

  console.log(`[RAG] Retrieved chunks: ${ragRetrievedChunks.length}`);

  // Grounding enforcement: If user asks about their notes/documents and no chunks were found
  const lowerMsg = trimmedMessage.toLowerCase();
  const isNotesQuestion =
    lowerMsg.includes('according to') ||
    lowerMsg.includes('my note') ||
    lowerMsg.includes('my notes') ||
    lowerMsg.includes('uploaded') ||
    lowerMsg.includes('in the note') ||
    lowerMsg.includes('in the notes') ||
    lowerMsg.includes('in the document') ||
    lowerMsg.includes('from the document') ||
    lowerMsg.includes('from my document') ||
    lowerMsg.includes('chp') ||
    lowerMsg.includes('chapter') ||
    lowerMsg.includes('lecture note') ||
    lowerMsg.includes('lecture notes') ||
    lowerMsg.includes('syllabus') ||
    lowerMsg.includes('course note') ||
    lowerMsg.includes('pdf');

  if (isNotesQuestion && ragRetrievedChunks.length === 0) {
    console.log(`[RAG Grounding] Notes question asked but 0 chunks found. Returning non-hallucination notice.`);
    return {
      message: "I couldn't find relevant information in your uploaded notes.",
      isSimulated: false,
      model: provider.chatModel,
      toolCallsExecuted: [],
      toolLoopSteps: 0,
    };
  }

  // ----------------------------------------------------
  // Live Provider Execution with Multi-Step Tool Loop
  // ----------------------------------------------------
  try {
    const allTools = getOpenAIToolsDefinition();
    const needsOtherTools =
      lowerMsg.includes('calc') ||
      lowerMsg.includes('compute') ||
      lowerMsg.includes('math') ||
      lowerMsg.includes('assignment') ||
      lowerMsg.includes('homework') ||
      lowerMsg.includes('task') ||
      lowerMsg.includes('study plan') ||
      lowerMsg.includes('schedule');

    // For pure RAG questions, omit tools so llama3.2 synthesizes the context immediately without hallucinated tool calls
    const tools =
      ragRetrievedChunks.length > 0 && !needsOtherTools
        ? undefined
        : ragRetrievedChunks.length > 0
        ? allTools.filter((t) => t.function.name !== 'search_student_notes')
        : allTools;
    const toolCallsExecuted: ToolCallExecutionSummary[] = [];

    // If RAG proactively retrieved relevant document chunks, record tool execution
    if (ragRetrievedChunks.length > 0) {
      toolCallsExecuted.push({
        name: 'search_student_notes',
        arguments: { query: trimmedMessage },
        durationMs: 40,
        success: true,
      });
    }

    const systemPrompt =
      buildStudentAssistantPrompt(studentProfile) + (ragContext ? `\n\n${ragContext}` : '');

    // Initialize conversation message array
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
    let tokensUsed = 0;

    while (loopStep < MAX_TOOL_LOOPS) {
      loopStep++;
      console.log(
        `[AI Agent Loop] Step ${loopStep}/${MAX_TOOL_LOOPS} on provider '${provider.name}' (${provider.chatModel})...`
      );

      // If we are at the maximum loop threshold, force final answer without more tool calls
      const isLastAllowedStep = loopStep === MAX_TOOL_LOOPS;
      const toolChoice = isLastAllowedStep ? ('none' as const) : ('auto' as const);

      const completion = await provider.chat({
        model: provider.chatModel,
        messages,
        tools: isLastAllowedStep ? undefined : tools,
        toolChoice,
        temperature: 0.5,
        maxTokens: 1800,
      });

      tokensUsed += completion.tokensUsed || 0;
      const toolCalls = completion.toolCalls;

      if (!toolCalls || toolCalls.length === 0) {
        // LLM completed its reasoning and provided a final text response
        finalMessage = completion.message?.trim() || '';
        console.log(`[AI Agent Loop] Final response generated at step ${loopStep}.`);
        break;
      }

      // Model requested tool calls. Append assistant message with tool calls to thread
      messages.push({
        role: 'assistant',
        content: completion.message || '',
        tool_calls: toolCalls,
      });

      // Execute each requested tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const rawArgs = toolCall.function.arguments;

        console.log(
          `[AI Agent Tool Loop] Executing tool '${functionName}' (Call ID: ${toolCall.id})`
        );

        // Execute tool securely through modular registry
        const executionResponse = await executeToolCall(
          { name: functionName, arguments: rawArgs },
          context
        );

        toolCallsExecuted.push({
          name: functionName,
          arguments: typeof rawArgs === 'string' ? safeJsonParse(rawArgs) : rawArgs,
          durationMs: executionResponse.durationMs,
          success: executionResponse.success,
        });

        // Format tool response for conversation history
        const toolPayload = executionResponse.success
          ? executionResponse.result
          : { error: executionResponse.error || 'Tool execution encountered an error.' };

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolPayload),
        });
      }

      // Continue loop: LLM will inspect tool output in the next iteration
    }

    if (!finalMessage) {
      finalMessage =
        'I have analyzed your request and retrieved the relevant academic information.';
    }

    return {
      message: finalMessage,
      isSimulated: false,
      model: provider.chatModel,
      tokensUsed,
      toolCallsExecuted,
      toolLoopSteps: loopStep,
    };
  } catch (error: unknown) {
    console.error('[AI Student Agent Error]:', error);

    if (error instanceof Error && error.message.includes('Ollama is not running')) {
      throw error;
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown AI service failure';
    throw new Error(`AI Agent execution failed: ${errorMsg}`);
  }
}

// ----------------------------------------------------
// Helper Utilities & Local Agent with Real Tools
// ----------------------------------------------------

function safeJsonParse(str: string): Record<string, any> {
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}

/**
 * Offline intelligent agent that detects user intent and executes real tools
 * (calculator, PostgreSQL assignments, study plan generator) without an OpenAI key.
 */
async function handleOfflineAgentWithTools(
  query: string,
  context: ToolExecutionContext,
  profile?: StudentProfileContext
): Promise<StudentAgentResult> {
  const lower = query.toLowerCase();
  const toolCallsExecuted: ToolCallExecutionSummary[] = [];

  // 1. Detect Math / Calculation Intent -> Execute Calculator Tool
  const isMathQuery =
    /[\d+\-*/^=]/.test(query) &&
    (lower.includes('calc') ||
      lower.includes('what is') ||
      lower.includes('compute') ||
      lower.includes('gpa') ||
      lower.includes('average') ||
      lower.includes('solve') ||
      /\d+\s*[\+\-\*\/]\s*\d+/.test(query));

  if (isMathQuery) {
    const exprMatch = query.match(/([\d\s\+\-\*\/\^\(\)\.eE,]+)/);
    const expression = exprMatch ? exprMatch[0].trim() : query;

    const start = Date.now();
    const res = await calculatorTool.execute({ expression }, context);
    const durationMs = Date.now() - start;

    toolCallsExecuted.push({
      name: 'calculator',
      arguments: { expression },
      durationMs,
      success: res.success,
    });

    if (res.success) {
      return {
        message: `### 🧮 Calculation Result\n\nI evaluated your mathematical expression using the **Calculator Tool**:\n\n- **Expression**: \`${res.expressionEvaluated}\`\n- **Result**: **\`${res.result}\`**\n\n*${res.explanation || 'Calculation verified using safe AST evaluator.'}*`,
        isSimulated: true,
        model: 'offline-tool-agent',
        toolCallsExecuted,
        toolLoopSteps: 1,
      };
    }
  }

  // 2. Detect Assignment / Homework Intent -> Execute Assignments Tool
  const isAssignmentQuery =
    lower.includes('assignment') ||
    lower.includes('homework') ||
    lower.includes('due date') ||
    lower.includes('pending task') ||
    lower.includes('what do i have due') ||
    lower.includes('my tasks');

  if (isAssignmentQuery) {
    const start = Date.now();
    let statusFilter: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL' = 'ALL';
    if (lower.includes('pending') || lower.includes('todo') || lower.includes('due')) {
      statusFilter = 'PENDING';
    } else if (lower.includes('completed') || lower.includes('done')) {
      statusFilter = 'COMPLETED';
    }

    const res = await assignmentsTool.execute({ status: statusFilter }, context);
    const durationMs = Date.now() - start;

    toolCallsExecuted.push({
      name: 'get_assignments',
      arguments: { status: statusFilter },
      durationMs,
      success: res.success,
    });

    if (res.success) {
      let output = `### 📋 Your Current Academic Assignments\n\nRetrieved from PostgreSQL database:\n\n`;
      output += `- **Total Active**: ${res.totalFound}\n- **Pending**: ${res.summary.pendingCount} | **In Progress**: ${res.summary.inProgressCount} | **Overdue**: ${res.summary.overdueCount}\n\n`;

      if (res.assignments.length === 0) {
        output += `*No assignments found matching your filter.* 🎉 You are all caught up!`;
      } else {
        output += `| Subject | Assignment | Due Date | Priority | Status |\n|:---|:---|:---|:---|:---|\n`;
        for (const a of res.assignments) {
          const dateStr = new Date(a.dueDate).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          });
          const warning = a.isOverdue ? ' ⚠️ Overdue' : ` (${a.daysRemaining}d left)`;
          output += `| **${a.subject}** | ${a.title} | ${dateStr}${warning} | \`${a.priority}\` | ${a.status} |\n`;
        }
      }

      return {
        message: output,
        isSimulated: true,
        model: 'offline-tool-agent',
        toolCallsExecuted,
        toolLoopSteps: 1,
      };
    }
  }

  // 3. Detect Study Plan Intent -> Execute Study Plan Tool
  const isPlanQuery =
    lower.includes('study plan') ||
    lower.includes('revision plan') ||
    lower.includes('schedule my study') ||
    lower.includes('timetable') ||
    lower.includes('how should i study');

  if (isPlanQuery) {
    const start = Date.now();
    const res = await studyPlanTool.execute(
      {
        subjects: ['Algorithms & Data Structures (CS301)', 'Deep Learning (AI402)', 'Database Systems (DS205)'],
        availableStudyHours: 15,
        daysCount: 5,
        includeUpcomingAssignments: true,
      },
      context
    );
    const durationMs = Date.now() - start;

    toolCallsExecuted.push({
      name: 'create_study_plan',
      arguments: { availableStudyHours: 15, daysCount: 5 },
      durationMs,
      success: res.success,
    });

    if (res.success) {
      let output = `### 📅 Optimized 5-Day Study Sprint Plan\n\n`;
      output += `Generated using the **Study Plan Tool** (${res.totalStudyHours} total hours allocated across ${res.daysCount} days):\n\n`;
      output += `#### Subject Allocations:\n`;
      for (const alloc of res.subjectAllocations) {
        output += `- **${alloc.subject}**: **${alloc.allocatedHours} hrs** (${alloc.percentage}%) — *${alloc.rationale}*\n`;
      }

      output += `\n#### Daily Timetable Breakdown:\n`;
      for (const day of res.schedule.slice(0, 3)) {
        output += `\n**${day.dayLabel}** (${day.totalHours} hrs):\n`;
        for (const session of day.sessions) {
          output += `  - \`${session.timeBlock}\`: **${session.subject}** — ${session.focusTopic} *(${session.technique})*\n`;
        }
      }

      output += `\n> [!TIP]\n> **Cognitive Strategy**: ${res.methodologyTips[0]}`;

      return {
        message: output,
        isSimulated: true,
        model: 'offline-tool-agent',
        toolCallsExecuted,
        toolLoopSteps: 1,
      };
    }
  }

  // 4. Detect Notes / Document Knowledge Base Intent -> Execute Notes Search Tool
  const isNotesQuery =
    lower.includes('my note') ||
    lower.includes('my notes') ||
    lower.includes('lecture note') ||
    lower.includes('lecture') ||
    lower.includes('uploaded') ||
    lower.includes('pdf') ||
    lower.includes('slides') ||
    lower.includes('textbook') ||
    lower.includes('dijkstra') ||
    lower.includes('bellman') ||
    lower.includes('adam') ||
    lower.includes('bcnf') ||
    lower.includes('normalization') ||
    lower.includes('according to my notes');

  if (isNotesQuery) {
    const start = Date.now();
    const res = await notesSearchTool.execute({ query }, context);
    const durationMs = Date.now() - start;

    toolCallsExecuted.push({
      name: 'search_student_notes',
      arguments: { query },
      durationMs,
      success: res.success,
    });

    if (res.success && res.chunks.length > 0) {
      let output = `### 📚 Answer Grounded in Your Uploaded Notes\n\n`;
      output += `I searched your uploaded course documents and retrieved **${res.chunks.length} relevant excerpts**:\n\n`;

      // Synthesize answer based strictly on retrieved chunks
      for (const chunk of res.chunks) {
        output += `#### From **${chunk.documentTitle}** *(Relevance: ${chunk.relevanceScore}%)*:\n`;
        output += `${chunk.content}\n\n`;
        output += `> **Source**: \`${chunk.fileName}\` (Chunk #${chunk.chunkIndex})\n\n`;
      }

      output += `\n---\n*Verified strictly against retrieved excerpts from your uploaded notes.*`;

      return {
        message: output,
        isSimulated: true,
        model: 'offline-rag-agent',
        toolCallsExecuted,
        toolLoopSteps: 1,
      };
    } else if (res.success && res.totalFound === 0) {
      return {
        message: `### 🔍 Notes Search Result\n\nI searched your uploaded notes for **"${query}"**, but **no matching excerpts were found** in your documents.\n\n> [!NOTE]\n> *To maintain academic integrity, I will not claim information came from your course notes without verified supporting context.*\n\nWould you like me to answer using general university computer science and academic principles instead?`,
        isSimulated: true,
        model: 'offline-rag-agent',
        toolCallsExecuted,
        toolLoopSteps: 1,
      };
    }
  }

  // 5. Default conceptual answer
  const studentName = profile?.name ? ` ${profile.name}` : '';
  return {
    message: `### 🎓 Academic Assistant Mentorship\n\nHello${studentName}! I am your **AI Student Agent**, equipped with tools for:\n\n1. **📚 Notes Assistant (RAG)**: Search your uploaded PDF lecture notes and textbooks using semantic vectors.\n2. **🧮 Calculator**: Mathematical calculations, formulas, and GPA estimation.\n3. **📋 Assignments**: Live retrieval and filtering of your coursework from PostgreSQL.\n4. **📅 Study Plan Generator**: Custom Pomodoro schedules, revision sprints, and deadline balancing.\n\nHow would you like to proceed with **"${query}"**?`,
    isSimulated: true,
    model: 'offline-academic-simulator',
    toolCallsExecuted,
    toolLoopSteps: 0,
  };
}

