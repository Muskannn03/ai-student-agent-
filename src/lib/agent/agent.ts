// ==========================================
// AI Academic Agent - Core Agent Service
// Foundational Tool System (Phase 6 Step 1)
// Integrates Llama 3.2 with searchNotes tool
// ==========================================

import {
  AgentInput,
  AgentOutput,
  AgentSourceCitation,
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
 * Evaluates whether the user's query requires uploaded notes search
 * vs general conceptual / academic knowledge.
 */
export function shouldConsultNotes(userMessage: string): boolean {
  const lower = userMessage.toLowerCase().trim();

  return (
    lower.includes('uploaded note') ||
    lower.includes('uploaded notes') ||
    lower.includes('my note') ||
    lower.includes('my notes') ||
    lower.includes('in the note') ||
    lower.includes('in the notes') ||
    lower.includes('from the note') ||
    lower.includes('from my note') ||
    lower.includes('from the notes') ||
    lower.includes('from my notes') ||
    lower.includes('course note') ||
    lower.includes('lecture note') ||
    lower.includes('lecture notes') ||
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
    lower.includes('syllabus')
  );
}

/**
 * Evaluates whether the user's query requests personal student data
 * (assignments, deadlines, tasks, or uploaded course notes)
 * vs general conceptual / academic knowledge.
 */
export function requiresStudentTools(userMessage: string): boolean {
  const lower = userMessage.toLowerCase().trim();

  // 1. Direct consultation of uploaded notes
  if (shouldConsultNotes(lower)) {
    return true;
  }

  // 2. Assignment / Task / Deadline related inquiries
  const assignmentKeywords = [
    'assignment',
    'assignments',
    'homework',
    'task',
    'tasks',
    'overdue',
    'deadline',
    'deadlines',
    'due',
    'upcoming',
    'due date',
    'due dates',
    'submission',
    'submissions',
  ];

  if (assignmentKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // 3. Student profile / personal details related inquiries
  const profileKeywords = [
    'my name',
    'who am i',
    'about myself',
    'about me',
    'tell me about',
    'profile',
    'student id',
    'my id',
    'student details',
    'my details',
    'academic profile',
    'enrolled in',
    'course am i',
    'what course',
    'which course',
    'department am i',
    'semester am i',
    'what semester',
    'which semester',
    'my semester',
    'my course',
    'my department',
    'my college',
    'my skills',
    'my career',
  ];

  if (profileKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // 4. Study plan / schedule related inquiries
  const studyPlanKeywords = [
    'study plan',
    'study schedule',
    'study timetable',
    'revision plan',
    'plan my stud',
    'plan a study',
    'create a study',
    'make a study',
    'study routine',
    'focus on studying',
    'what should i study',
  ];

  if (studyPlanKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // 5. Fresh data / check again / updates inquiries
  const freshKeywords = [
    'check again',
    'search again',
    'look again',
    'any new',
    'any update',
    'any updates',
    'check my',
    'check the',
  ];

  if (freshKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // 6. Contextual status inquiries (e.g. "What is pending?", "What about completed ones?", "Any overdue?")
  if (
    lower.includes('pending') ||
    lower.includes('completed') ||
    lower.includes('overdue')
  ) {
    return true;
  }

  return false;
}

/**
 * Constructs the system prompt instructing Llama 3.2 on academic mentorship,
 * tool invocation discipline, strict anti-hallucination grounding, and conversational context awareness.
 */
function buildSystemPrompt(context: AgentInput['context']): string {
  const studentName = context.studentName || 'Student';
  const course = context.course || 'Computer Science';
  const semester = context.semester ? `, Semester ${context.semester}` : '';

  return `You are AISA (AI Student Agent), an intelligent academic co-pilot for ${studentName} (${course}${semester}).

TOOL SYSTEM CAPABILITIES:
You have access to tools to help the student manage their academic life:
1. "searchNotes": Search the student's personal uploaded PDF notes and course materials using semantic vector retrieval.
2. "getAssignments": Retrieve the student's assignments from PostgreSQL, with optional status filter ("pending", "completed", "overdue", "all").
3. "getUpcomingDeadlines": Retrieve the student's upcoming assignments and academic deadlines within a specified number of days (e.g. 7 days for this week, 3 days, etc.).
4. "getStudentProfile": Retrieve the current student's profile and academic information from PostgreSQL (such as student name, ID, enrolled course, department/college, semester, and skills).
5. "createStudyPlan": Generate a personalized, structured academic study plan and schedule for the current student based on their profile, active assignments, and upcoming deadlines from PostgreSQL, optionally incorporating relevant course notes.

CONVERSATION CONTEXT & INTELLIGENT FOLLOW-UP RULES:
1. CONTEXT CONTINUITY & CO-REFERENCE RESOLUTION:
   You have access to the recent messages in this conversation.
   Always interpret the user's latest message in light of earlier turns.
   Resolve pronouns and relative references naturally:
   - "Day 3", "the plan", "this schedule" -> refers to the previously generated study plan.
   - "them", "these", "which one", "which should I focus on first" -> refers to the previously retrieved assignments or deadlines.
   - "it", "its", "that" -> refers to the topic under discussion (e.g. Timsort, binary search).

2. FOLLOW-UP CATEGORIES & BEHAVIOR:
   A. REFINEMENT & SIMPLIFICATION:
      - Examples: "Make it easier", "Make Day 3 shorter", "Give me more practice", "Explain that more simply", "Make the explanation shorter".
      - Action: Directly refine and answer based on the conversation history. Do NOT call tools.
   B. PLAN MODIFICATION & CONSTRAINTS:
      - Examples: "Make Day 6 and Day 7 revision days", "Reduce each session to 45 minutes", "I only have 2 hours per day", "Change the plan to 5 days", "Focus more on Data Structures".
      - Action: Use the conversation history as the source of truth for the existing plan. Apply the new constraint or modification directly, keeping unaffected days intact. Do NOT call "createStudyPlan" or any tool for multi-turn modifications of an existing plan.
   C. TOPIC CONTINUATION & COMPARISONS:
      - Examples: "Compare it with linear search", "Which one requires sorted data?", "What are its advantages?", "Give me a simple example".
      - Action: Answer directly using academic knowledge while maintaining the active topic from previous turns. Do NOT call tools unless specifically asked to search notes.
   D. TOOL RESULTS FOLLOW-UP & REASONING:
      - Examples: "Which should I focus on first?", "What should I study first?".
      - Action: Reason over the previously returned tool results. If previous messages confirmed 0 deadlines or 0 pending assignments, respect that fact honestly and suggest study focus based on student profile without inventing imaginary deadlines or assignments.

3. FRESH DATA VS CONVERSATION CONTEXT:
   - When the student asks whether they have assignments, deadlines, or tasks "now", "currently", "any new", "any updates", "latest", or asks to "check again" (e.g. "Do I have any assignments now?", "What deadlines do I have now?", "Are there any new assignments?"):
     Previous conversation data can become stale. You MUST call the appropriate tool ("getAssignments" or "getUpcomingDeadlines") to query the database for the current real-time state. Do NOT just repeat the old answer without calling the tool.
   - When the student asks to create a study plan incorporating retrieved items (e.g. "Create a study plan around them"):
     Call "createStudyPlan" to generate a plan grounded in the latest database records.

4. STRICT ANTI-HALLUCINATION:
   - Never invent assignments, deadlines, student profile data, or uploaded note contents.
   - If the database or notes contain 0 items, state that clearly and offer general guidance.

TOOL USAGE RULES:
1. GENERAL ACADEMIC QUESTIONS:
   For general conceptual, theoretical, or programming questions (e.g. "Explain binary search in simple terms.", "What is dynamic programming?", "How does quicksort work?"):
   - Do NOT call any tools.
   - Answer directly, clearly, and pedagogically using your own academic knowledge.

2. STUDY PLANS & REVISION SCHEDULES:
   - When the student asks to create a study plan, study schedule, or revision timetable (e.g. "Create a study plan for me", "Make me a 7 day study plan", "Create a 5 day study plan focused on Data Structures", "Create a study schedule for this week", "Help me plan my studies for the next 5 days"):
     Call "createStudyPlan" with the requested number of days (e.g. days: 7, days: 5) and the optional focus topic if specified.
   - Present the returned study plan clearly and logically by day, highlighting real assignment deadlines, overdue priorities, and structured study suggestions.

3. STUDENT PROFILE & IDENTITY:
   - When the student asks about their personal profile, identity, or academic enrollment (e.g. "What is my name?", "Show me my student profile", "What course am I enrolled in?", "What is my student ID?", "What department am I in?", "What semester am I in?", "Tell me my academic profile"):
     Call "getStudentProfile".
   - Present the student's details clearly, accurately, and politely based on the returned profile data.

4. UPCOMING DEADLINES:
   - When the student asks about upcoming deadlines, what is due soon, this week, or in the next N days (e.g. "What deadlines do I have this week?", "What is due in the next 3 days?", "Show me my upcoming deadlines", "What do I need to submit before next Monday?"):
     Call "getUpcomingDeadlines" with the appropriate number of days (e.g. days: 7 for "this week" or general upcoming deadlines, days: 3 for "next 3 days").
   - If getUpcomingDeadlines returns 0 deadlines (total: 0), clearly state that there are no upcoming deadlines within that timeframe.
   - When presenting deadlines, clearly list each deadline's title, subject, due date, and priority.

5. ASSIGNMENTS & TASKS:
   - When the student asks about their assignments by status, or asks a follow-up about another status (e.g. "Show my pending assignments", "What about completed ones?", "Which assignments are completed?", "Do I have any overdue assignments?", "Show all my assignments", "Check again"):
     Call "getAssignments" with the appropriate status ("pending", "completed", "overdue", or "all").
   - If getAssignments returns 0 assignments (total: 0), clearly state that there are currently no assignments matching that status.
   - When presenting assignments, clearly list each assignment's title, subject, due date, status, and whether it is overdue.

6. UPLOADED COURSE NOTES & SOURCE CITATIONS:
   - Call "searchNotes" ONLY when the user explicitly asks about their uploaded notes, course materials, uploaded documents, or mentions specific chapters/notes (e.g. "Explain binary search using my uploaded notes", "What does CHP 1 say?").
   - If searchNotes returns hasResults: false (0 chunks):
     Do NOT invent, hallucinate, or assume course material.
     Do NOT fabricate citations.
     State honestly and clearly: "I couldn't find relevant information in your uploaded notes. I can still give you a general explanation if you'd like."
   - If searchNotes returns results (hasResults: true):
     Ground your answer strictly in the retrieved chunk content.
     Clearly state that the information came from the student's uploaded notes.
     At the end of your response, ALWAYS include a source citation section in this exact format:

📚 **Sources**
- \`documentName\`

     If multiple unique documents were retrieved, list each unique document on its own line:
📚 **Sources**
- \`documentName_1\`
- \`documentName_2\`

     Deduplicate multiple chunks from the same document so each document is cited only once.
     Do NOT invent page numbers or sections that were not in the document metadata.`;
}

/**
 * Execute the autonomous academic agent.
 */
export async function runAcademicAgent(input: AgentInput): Promise<AgentOutput> {
  const { userMessage, history = [], context, onProgress } = input;

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    throw new Error('User message is required and cannot be empty.');
  }

  const trimmedMessage = userMessage.trim();
  console.log(`[AGENT] Request received`);

  onProgress?.({ type: 'status', status: 'Thinking...' });

  const provider = getAIProvider();

  // Availability check for Ollama runtime
  const isAvailable = await provider.isAvailable();
  if (!isAvailable && provider.name === 'ollama') {
    throw new Error('Ollama is not running. Please start Ollama and try again.');
  }

  // 1. Determine tool definitions available
  const isNotesQuery = shouldConsultNotes(trimmedMessage);
  const needsTools = requiresStudentTools(trimmedMessage);
  const toolDefinitions = getToolDefinitionsForModel();

  // For queries not asking about personal student data, omit tools so Llama 3.2 answers directly without tool calling
  const availableTools = needsTools ? toolDefinitions : undefined;
  const toolChoice = needsTools ? 'auto' : 'none';

  console.log(`[AGENT] Tool definitions available: ${availableTools ? availableTools.length : 0}`);

  const systemPrompt = buildSystemPrompt(context);
  const toolCallsExecuted: ToolCallExecutionSummary[] = [];

  // Bounded sliding window for conversation history (latest 20 messages)
  const boundedHistory = (history || []).slice(-20);

  // Build message thread
  const messages: ProviderChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...boundedHistory.map((msg) => ({
      role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    })),
    { role: 'user', content: trimmedMessage },
  ];

  let loopStep = 0;
  let finalMessage = '';
  let streamedViaChunk = false;

  while (loopStep < MAX_TOOL_ITERATIONS) {
    loopStep++;
    const isLastAllowedStep = loopStep === MAX_TOOL_ITERATIONS;
    const isGeneratingFinalAnswer = isLastAllowedStep || (!availableTools || availableTools.length === 0 || toolChoice === 'none');

    // Send request to Llama 3.2 via OllamaProvider
    const completion = await provider.chat({
      model: provider.chatModel,
      messages,
      tools: isLastAllowedStep ? undefined : availableTools,
      toolChoice: isLastAllowedStep ? 'none' : toolChoice,
      temperature: 0.3,
      maxTokens: 1800,
      onChunk: isGeneratingFinalAnswer && onProgress ? (chunk: string) => {
        streamedViaChunk = true;
        onProgress({ type: 'chunk', chunk });
      } : undefined,
    });

    const toolCalls = completion.toolCalls;

    // Case 1: Llama 3.2 produced a direct text response without tool calls
    if (!toolCalls || toolCalls.length === 0) {
      finalMessage = completion.message?.trim() || '';
      console.log(`[AGENT] Final response generated`);

      // If it wasn't streamed directly from provider (e.g. tools were passed in step 1),
      // stream the complete text progressively to the client callback
      if (!streamedViaChunk && onProgress && finalMessage) {
        const words = finalMessage.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          onProgress({ type: 'chunk', chunk });
        }
      }
      break;
    }

    // Case 2: Llama 3.2 decided to call one or more tools
    messages.push({
      role: 'assistant',
      content: completion.message || '',
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const rawArgs = toolCall.function.arguments;

      console.log(`[AGENT] Tool selected: ${toolName}`);

      const statusDescription =
        toolName === 'searchNotes' ? 'Searching your notes...' :
        toolName === 'getAssignments' ? 'Checking your assignments...' :
        toolName === 'getUpcomingDeadlines' ? 'Checking upcoming deadlines...' :
        toolName === 'getStudentProfile' ? 'Loading student profile...' :
        toolName === 'createStudyPlan' ? 'Building your study plan...' :
        `Executing ${toolName}...`;

      onProgress?.({ type: 'status', status: statusDescription });
      onProgress?.({ type: 'tool_call', tool: toolName });

      // Verify tool exists in registry
      const tool = getToolByName(toolName);
      if (!tool) {
        console.warn(`[AGENT] Warning: Model requested unregistered tool "${toolName}"`);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `Tool "${toolName}" is not registered in the agent system.`,
          }),
        });
        continue;
      }

      // Execute tool securely server-side
      const execution = await executeAgentTool(toolName, rawArgs, context);

      console.log(`[AGENT] Tool result received`);

      toolCallsExecuted.push({
        name: toolName,
        arguments: typeof rawArgs === 'string' ? safeJsonParse(rawArgs) : rawArgs,
        durationMs: execution.durationMs,
        success: execution.success,
      });

      // Pass tool result back to Llama 3.2 message thread
      const toolPayload = execution.success
        ? execution.result
        : { error: execution.error || 'Tool execution encountered an error.' };

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolPayload),
      });
    }

    onProgress?.({ type: 'status', status: 'Synthesizing response...' });
    // Loop continues: Llama 3.2 receives the tool result and generates the final answer
  }

  if (!finalMessage) {
    if (toolCallsExecuted.some((t) => t.name === 'createStudyPlan')) {
      finalMessage = "I have generated your personalized study plan.";
    } else if (toolCallsExecuted.some((t) => t.name === 'getStudentProfile')) {
      finalMessage = "I have retrieved your student profile.";
    } else if (toolCallsExecuted.some((t) => t.name === 'getUpcomingDeadlines')) {
      finalMessage = "I have checked your upcoming academic deadlines.";
    } else if (toolCallsExecuted.some((t) => t.name === 'getAssignments')) {
      finalMessage = "I have checked your assignments in the system.";
    } else {
      finalMessage = "I couldn't find relevant information in your uploaded notes.";
    }
    console.log('[AGENT] Final response generated');
  }

  // Strict grounding enforcement and structured RAG citation extraction
  const sources: AgentSourceCitation[] = [];
  const seenDocNames = new Set<string>();

  const searchNotesExecuted = toolCallsExecuted.find((t) => t.name === 'searchNotes' && t.success);
  if (searchNotesExecuted) {
    const searchToolMsg = messages.find((m) => {
      if (m.role !== 'tool') return false;
      try {
        const parsed = JSON.parse(m.content);
        return parsed.hasResults !== undefined || Array.isArray(parsed.chunks) || Array.isArray(parsed.results);
      } catch {
        return false;
      }
    });

    if (searchToolMsg) {
      try {
        const parsed = JSON.parse(searchToolMsg.content);
        const hasChunks = (Array.isArray(parsed.chunks) && parsed.chunks.length > 0) ||
                          (Array.isArray(parsed.results) && parsed.results.length > 0);
        const hasResults = parsed.hasResults !== false && hasChunks;

        if (!hasResults) {
          // Negative RAG: no relevant chunks found in student's uploaded notes
          // Strip any fabricated citation sections
          finalMessage = finalMessage.replace(/📚\s*\*\*Sources\*\*[\s\S]*$/gi, '').trim();

          const lowerFinal = finalMessage.toLowerCase();
          const alreadyAcknowledged =
            lowerFinal.includes("couldn't find") ||
            lowerFinal.includes('could not find') ||
            lowerFinal.includes('no relevant') ||
            lowerFinal.includes('not found') ||
            lowerFinal.includes('not in your uploaded');

          if (!alreadyAcknowledged) {
            finalMessage = "I couldn't find relevant information in your uploaded notes. I can still give you a general explanation if you'd like.";
          }
        } else {
          // Positive RAG: extract and deduplicate source documents
          if (Array.isArray(parsed.results) && parsed.results.length > 0) {
            for (const r of parsed.results) {
              const docName = r.source?.documentName;
              const docId = r.source?.documentId || docName;
              if (docName && !seenDocNames.has(docName)) {
                seenDocNames.add(docName);
                sources.push({
                  documentId: docId,
                  documentName: docName,
                  similarity: r.source?.similarity,
                  chunkIndex: r.source?.chunkIndex,
                });
              }
            }
          } else if (Array.isArray(parsed.chunks) && parsed.chunks.length > 0) {
            for (const c of parsed.chunks) {
              const docName = c.documentTitle;
              const docId = c.documentId || docName;
              if (docName && !seenDocNames.has(docName)) {
                seenDocNames.add(docName);
                sources.push({
                  documentId: docId,
                  documentName: docName,
                  similarity: c.similarity,
                });
              }
            }
          }

          // Ensure canonical citation formatting is appended if not already present in final message
          const hasCitationBlock =
            finalMessage.includes('📚 **Sources**') ||
            finalMessage.includes('📚 Sources') ||
            finalMessage.includes('**Sources**');

          if (!hasCitationBlock && sources.length > 0) {
            const citationLines = sources.map((s) => `- \`${s.documentName}\``).join('\n');
            const citationBlock = `\n\n📚 **Sources**\n${citationLines}`;
            finalMessage = `${finalMessage.trim()}${citationBlock}`;
            onProgress?.({ type: 'chunk', chunk: citationBlock });
          }
        }
      } catch {
        // ignore
      }
    }
  }

  onProgress?.({ type: 'done', status: 'Complete' });

  return {
    message: finalMessage,
    toolCallsExecuted,
    model: provider.chatModel,
    iterations: loopStep,
    isSimulated: false,
    sources: sources.length > 0 ? sources : undefined,
  };
}

function safeJsonParse(str: string): Record<string, any> {
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}
