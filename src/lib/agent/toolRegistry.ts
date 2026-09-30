// ==========================================
// AI Academic Agent - Tool Registry
// Implementation of academic tools with server-side safety & validation
// ==========================================

import {
  AgentTool,
  AgentContext,
  SearchNotesInput,
  SearchNotesOutput,
  GetAssignmentsInput,
  GetAssignmentsOutput,
  GetUpcomingDeadlinesInput,
  GetUpcomingDeadlinesOutput,
  GetStudentProfileInput,
  GetStudentProfileOutput,
  CreateStudyPlanInput,
  CreateStudyPlanOutput,
} from './types';
import { retrieveRelevantChunks } from '@/lib/rag/retrievalService';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

// ------------------------------------------
// Tool 1: searchNotes
// ------------------------------------------
export const searchNotesTool: AgentTool<SearchNotesInput, SearchNotesOutput> = {
  name: 'searchNotes',
  description:
    'Search the student\'s uploaded lecture notes and course documents using semantic vector retrieval. Use ONLY when the user explicitly asks about their uploaded notes, course materials, uploaded documents, or mentions specific chapters/notes (e.g. "Explain binary search using my uploaded notes", "What does CHP 1 say?"). Do NOT use for general concept explanations like "Explain binary search".',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The semantic search query or concept to search within the student notes.',
      },
      courseId: {
        type: 'string',
        description: 'Optional subject or course name/code filter (e.g. "CS301", "Web Technologies").',
      },
    },
    required: ['query'],
  },
  execute: async (input: SearchNotesInput, context: AgentContext): Promise<SearchNotesOutput> => {
    if (!input.query || typeof input.query !== 'string' || !input.query.trim()) {
      return { chunks: [] };
    }

    const cleanQuery = input.query.trim();
    const cleanSubject =
      input.courseId &&
      !['none', 'null', 'undefined', 'all', 'n/a', ''].includes(input.courseId.toLowerCase().trim())
        ? input.courseId.trim()
        : undefined;

    const retrieval = await retrieveRelevantChunks({
      query: cleanQuery,
      userId: context.userId,
      topK: 4,
      minSimilarity: 0.50,
      subjectFilter: cleanSubject,
    });

    console.log(`[AGENT] Retrieved chunks: ${retrieval.relevantChunks.length}`);

    return {
      chunks: retrieval.relevantChunks.map((chunk) => ({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        content: chunk.content,
        similarity: chunk.similarity,
        fileName: chunk.fileName,
        chunkIndex: chunk.chunkIndex,
      })),
    };
  },
};

// ------------------------------------------
// Tool 2: getAssignments
// ------------------------------------------
export const getAssignmentsTool: AgentTool<GetAssignmentsInput, GetAssignmentsOutput> = {
  name: 'getAssignments',
  description:
    'Retrieve the student\'s academic assignments from PostgreSQL. Use when the student asks to view, check, or list their assignments, homework, or pending tasks.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'overdue', 'all'],
        description: 'Filter assignments by completion status: "pending", "completed", "overdue", or "all" (default: "all").',
      },
    },
  },
  execute: async (input: GetAssignmentsInput, context: AgentContext): Promise<GetAssignmentsOutput> => {
    const rawStatus = (input.status || 'all').toLowerCase();
    const now = new Date();

    const where: any = {
      userId: context.userId,
    };

    if (rawStatus === 'pending') {
      where.status = { not: Status.COMPLETED };
      where.dueDate = { gte: now };
    } else if (rawStatus === 'overdue') {
      where.status = { not: Status.COMPLETED };
      where.dueDate = { lt: now };
    } else if (rawStatus === 'completed') {
      where.status = Status.COMPLETED;
    }

    const records = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: 30,
    });

    const assignments = records.map((a) => {
      const isOverdue = a.status !== Status.COMPLETED && new Date(a.dueDate) < now;
      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        description: a.description,
        dueDate: a.dueDate.toISOString(),
        status: isOverdue ? 'OVERDUE' : a.status,
        priority: a.priority,
        isOverdue,
      };
    });

    return {
      total: assignments.length,
      assignments,
    };
  },
};

// ------------------------------------------
// Tool 3: getUpcomingDeadlines
// ------------------------------------------
export const getUpcomingDeadlinesTool: AgentTool<GetUpcomingDeadlinesInput, GetUpcomingDeadlinesOutput> = {
  name: 'getUpcomingDeadlines',
  description:
    'Retrieve upcoming academic deadlines and due dates within a specified number of days (default: 7). Use when the student asks about deadlines, what is due soon, or what is due this week.',
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to look ahead for deadlines (default: 7).',
      },
    },
  },
  execute: async (input: GetUpcomingDeadlinesInput, context: AgentContext): Promise<GetUpcomingDeadlinesOutput> => {
    const days = Math.max(1, Math.min(Number(input.days) || 7, 90));
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + days * 86400000);

    const records = await prisma.assignment.findMany({
      where: {
        userId: context.userId,
        status: { not: Status.COMPLETED },
        dueDate: {
          gte: new Date(now.getTime() - 86400000), // include today
          lte: cutoffDate,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    const deadlines = records.map((a) => {
      const due = new Date(a.dueDate);
      const diffMs = due.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / 86400000);

      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        priority: a.priority,
        status: a.status,
      };
    });

    return {
      daysLookahead: days,
      total: deadlines.length,
      deadlines,
    };
  },
};

// ------------------------------------------
// Tool 4: getStudentProfile
// ------------------------------------------
export const getStudentProfileTool: AgentTool<GetStudentProfileInput, GetStudentProfileOutput> = {
  name: 'getStudentProfile',
  description:
    'Retrieve the current student\'s academic profile (college, course, semester, skills, career goals). Use when the student asks about their profile, enrolled course, skills, or academic standing.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (_input: GetStudentProfileInput, context: AgentContext): Promise<GetStudentProfileOutput> => {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      include: { studentProfile: true },
    });

    if (!user) {
      return {
        name: context.studentName || 'Student',
        email: context.userEmail || '',
        college: context.college || null,
        course: context.course || null,
        semester: context.semester || null,
        skills: [],
        careerGoals: null,
      };
    }

    return {
      name: user.name,
      email: user.email,
      college: user.studentProfile?.college ?? context.college ?? null,
      course: user.studentProfile?.course ?? context.course ?? null,
      semester: user.studentProfile?.semester ?? context.semester ?? null,
      skills: user.studentProfile?.skills ?? [],
      careerGoals: user.studentProfile?.careerGoals ?? null,
    };
  },
};

// ------------------------------------------
// Tool 5: createStudyPlan
// ------------------------------------------
export const createStudyPlanTool: AgentTool<CreateStudyPlanInput, CreateStudyPlanOutput> = {
  name: 'createStudyPlan',
  description:
    'Create and schedule a structured study session or revision plan in the student\'s academic calendar. Use when the student asks to plan, schedule, or create a study session or revision sprint.',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'The subject or course name (e.g. "Algorithms", "Database Systems", "Deep Learning").',
      },
      date: {
        type: 'string',
        description: 'Planned date for the study session (e.g. "tomorrow", "today", or "YYYY-MM-DD").',
      },
      durationMinutes: {
        type: 'number',
        description: 'Duration of the study session in minutes (e.g. 60, 120). Default: 60.',
      },
      topics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific topic(s) to cover during the study session.',
      },
    },
    required: ['subject'],
  },
  execute: async (input: CreateStudyPlanInput, context: AgentContext): Promise<CreateStudyPlanOutput> => {
    if (!input.subject || typeof input.subject !== 'string' || !input.subject.trim()) {
      throw new Error('A valid "subject" name is required to create a study plan.');
    }

    const cleanSubjectName = input.subject.trim();
    const durationMinutes = Math.max(15, Math.min(Number(input.durationMinutes) || 60, 480));

    // Parse target date
    const now = new Date();
    let targetDate = new Date(now.getTime() + 86400000); // default tomorrow
    targetDate.setHours(9, 0, 0, 0); // 9:00 AM

    if (input.date) {
      const lowerDate = input.date.toLowerCase().trim();
      if (lowerDate === 'today') {
        targetDate = new Date(now);
        targetDate.setHours(14, 0, 0, 0); // today 2:00 PM
      } else if (lowerDate === 'tomorrow') {
        targetDate = new Date(now.getTime() + 86400000);
        targetDate.setHours(9, 0, 0, 0);
      } else {
        const parsed = new Date(input.date);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      }
    }

    // Determine topic text
    const topicText =
      input.topics && Array.isArray(input.topics) && input.topics.length > 0
        ? input.topics.join(', ')
        : `${cleanSubjectName} Core Concepts Revision`;

    // Find or create subject relation in PostgreSQL
    let subjectRecord = await prisma.subject.findFirst({
      where: {
        userId: context.userId,
        name: { equals: cleanSubjectName, mode: 'insensitive' },
      },
    });

    if (!subjectRecord) {
      subjectRecord = await prisma.subject.create({
        data: {
          userId: context.userId,
          name: cleanSubjectName,
          description: `Course created for ${cleanSubjectName} study sessions`,
        },
      });
    }

    // Create StudySession using verified Prisma model
    const session = await prisma.studySession.create({
      data: {
        userId: context.userId,
        subjectId: subjectRecord.id,
        date: targetDate,
        duration: durationMinutes,
        topic: topicText,
        status: 'PLANNED',
      },
    });

    const dateStr = targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return {
      success: true,
      message: `Successfully scheduled a ${durationMinutes}-minute study session for ${cleanSubjectName} on ${dateStr}.`,
      plan: {
        id: session.id,
        subject: cleanSubjectName,
        date: session.date.toISOString(),
        durationMinutes: session.duration,
        topic: session.topic,
        status: session.status,
      },
    };
  },
};

// ------------------------------------------
// Tool Registry Map & Helpers
// ------------------------------------------
const TOOL_REGISTRY: Record<string, AgentTool> = {
  searchNotes: searchNotesTool,
  getAssignments: getAssignmentsTool,
  getUpcomingDeadlines: getUpcomingDeadlinesTool,
  getStudentProfile: getStudentProfileTool,
  createStudyPlan: createStudyPlanTool,
};

export function getRegisteredTools(): AgentTool[] {
  return Object.values(TOOL_REGISTRY);
}

export function getToolByName(name: string): AgentTool | undefined {
  return TOOL_REGISTRY[name];
}

/**
 * Returns tool definitions formatted for Llama 3.2 / Ollama function calling
 */
export function getToolDefinitionsForModel() {
  return getRegisteredTools().map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

/**
 * Executes a registered tool securely server-side
 */
export async function executeAgentTool(
  toolName: string,
  rawArgs: Record<string, any> | string,
  context: AgentContext
): Promise<{ success: boolean; result?: any; error?: string; durationMs: number }> {
  const tool = getToolByName(toolName);
  if (!tool) {
    return {
      success: false,
      error: `Tool "${toolName}" is not registered in the agent system.`,
      durationMs: 0,
    };
  }

  let parsedArgs: Record<string, any> = {};
  if (typeof rawArgs === 'string') {
    try {
      parsedArgs = JSON.parse(rawArgs);
    } catch {
      parsedArgs = { raw: rawArgs };
    }
  } else if (rawArgs && typeof rawArgs === 'object') {
    parsedArgs = rawArgs;
  }

  const start = Date.now();
  console.log(`[AGENT] Tool selected: ${toolName}`);

  try {
    const result = await tool.execute(parsedArgs, context);
    const durationMs = Date.now() - start;
    console.log(`[AGENT] Tool completed: ${toolName} (${durationMs}ms)`);
    return {
      success: true,
      result,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - start;
    console.error(`[AGENT] Tool "${toolName}" error:`, error?.message || error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed.',
      durationMs,
    };
  }
}
