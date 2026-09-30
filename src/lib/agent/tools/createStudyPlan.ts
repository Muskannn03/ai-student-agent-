// ==========================================
// Tool: createStudyPlan
// Generates a personalized academic study plan for the current student
// Integrating profile, assignments, upcoming deadlines, and course notes
// ==========================================

import {
  AgentTool,
  AgentContext,
  CreateStudyPlanInput,
  CreateStudyPlanOutput,
  StudyPlanPriorityItem,
  StudyPlanDeadlineItem,
  StudyPlanDay,
  StudyPlanNoteContext,
} from '../types';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';
import { retrieveRelevantChunks } from '@/lib/rag/retrievalService';

/**
 * Validates input for createStudyPlan tool at runtime.
 * Ensures days is between 1 and 30 (default: 7) and focus is at most 200 chars.
 */
export function validateCreateStudyPlanInput(rawInput: any): { days: number; focus?: string } {
  if (rawInput === undefined || rawInput === null || typeof rawInput !== 'object') {
    return { days: 7 };
  }

  let days = 7;
  if (rawInput.days !== undefined && rawInput.days !== null && rawInput.days !== '') {
    let parsedDays: number;
    if (typeof rawInput.days === 'number') {
      parsedDays = rawInput.days;
    } else if (typeof rawInput.days === 'string') {
      parsedDays = parseInt(rawInput.days.trim(), 10);
    } else {
      throw new Error('Validation error: "days" must be an integer.');
    }

    if (isNaN(parsedDays) || !Number.isInteger(parsedDays)) {
      throw new Error('Validation error: "days" must be a valid integer.');
    }
    if (parsedDays < 1) {
      throw new Error('Validation error: "days" must be at least 1.');
    }
    if (parsedDays > 30) {
      throw new Error('Validation error: "days" cannot exceed 30.');
    }
    days = parsedDays;
  }

  let focus: string | undefined = undefined;
  if (typeof rawInput.focus === 'string' && rawInput.focus.trim()) {
    focus = rawInput.focus.trim().slice(0, 200);
  }

  return { days, focus };
}

export const createStudyPlanTool: AgentTool<CreateStudyPlanInput, CreateStudyPlanOutput> = {
  name: 'createStudyPlan',
  description:
    "Generate a personalized, structured academic study plan and schedule for the current student based on their profile, active assignments, and upcoming deadlines from PostgreSQL, optionally incorporating relevant course notes.",
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'integer',
        minimum: 1,
        maximum: 30,
        description: 'Duration of the study plan in days (1 to 30). Defaults to 7.',
      },
      focus: {
        type: 'string',
        maxLength: 200,
        description:
          'Optional academic topic, course, or subject to prioritize in the study schedule (e.g. "Data Structures", "Operating Systems").',
      },
    },
  },
  execute: async (rawInput: CreateStudyPlanInput, context: AgentContext): Promise<CreateStudyPlanOutput> => {
    // 1. Runtime validation
    const { days, focus } = validateCreateStudyPlanInput(rawInput);

    // 2. Enforce verified server-side userId from context (Never accept client-supplied userId)
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Security Exception: Verified userId in AgentContext is required to create a study plan.');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    try {
      // 3. Retrieve student profile from PostgreSQL
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          studentProfile: {
            select: {
              college: true,
              course: true,
              semester: true,
              skills: true,
            },
          },
        },
      });

      const studentName = user?.name || context.studentName || 'Student';
      const studentCourse = user?.studentProfile?.course || context.course || 'Computer Science';
      const studentSemester = user?.studentProfile?.semester || context.semester || null;

      // 4. Retrieve active non-completed assignments from PostgreSQL
      const rawAssignments = await prisma.assignment.findMany({
        where: {
          userId,
          status: { not: Status.COMPLETED },
        },
        orderBy: {
          dueDate: 'asc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          dueDate: true,
          priority: true,
          status: true,
        },
      });

      // 5. Deterministic priority ordering:
      // (a) Overdue assignments first
      // (b) Nearer due dates second
      // (c) Higher priority level third
      const priorityWeights: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      const sortedAssignments = [...rawAssignments].sort((a, b) => {
        const aOverdue = a.dueDate < now;
        const bOverdue = b.dueDate < now;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const timeDiff = a.dueDate.getTime() - b.dueDate.getTime();
        if (timeDiff !== 0) return timeDiff;

        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      });

      const priorities: StudyPlanPriorityItem[] = sortedAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate.toISOString(),
        priority: a.priority,
        status: a.status,
        isOverdue: a.dueDate < now,
      }));

      // 6. Upcoming deadlines within the study plan window [now, endDate]
      const upcomingDeadlines: StudyPlanDeadlineItem[] = rawAssignments
        .filter((a) => a.dueDate >= now && a.dueDate <= endDate)
        .map((a) => ({
          id: a.id,
          title: a.title,
          subject: a.subject,
          dueDate: a.dueDate.toISOString(),
        }));

      // 7. Optional Notes / RAG retrieval if focus topic was specified
      let relevantNotes: StudyPlanNoteContext[] = [];
      if (focus) {
        try {
          const ragResult = await retrieveRelevantChunks({
            query: focus,
            userId,
            topK: 3,
            minSimilarity: 0.45,
          });

          if (ragResult && ragResult.relevantChunks.length > 0) {
            relevantNotes = ragResult.relevantChunks.map((chunk) => ({
              documentTitle: chunk.documentTitle,
              snippet:
                chunk.content.slice(0, 200).replace(/\s+/g, ' ').trim() +
                (chunk.content.length > 200 ? '...' : ''),
            }));
          }
        } catch (ragError) {
          // Gracefully continue even if note vector search encountered an error
          console.warn('[TOOL:createStudyPlan] Optional note retrieval skipped:', ragError);
        }
      }

      // 8. Build structured day-by-day schedule distinguishing real assignments from suggested tasks
      const defaultFocusTopic = focus || studentCourse;
      const schedule: StudyPlanDay[] = [];

      for (let dayIndex = 1; dayIndex <= days; dayIndex++) {
        const dayDate = new Date(now);
        dayDate.setDate(dayDate.getDate() + (dayIndex - 1));
        const dateString = dayDate.toISOString().split('T')[0];

        // Match real database deadlines due on this specific day
        const dayDeadlines = upcomingDeadlines.filter((dl) => {
          const dlDateStr = new Date(dl.dueDate).toISOString().split('T')[0];
          return dlDateStr === dateString;
        });

        const suggestedTasks: string[] = [];

        // Explicitly label real database tasks
        if (dayDeadlines.length > 0) {
          for (const dl of dayDeadlines) {
            suggestedTasks.push(`[Academic Deadline] Complete submission for: "${dl.title}"`);
          }
        }

        // If an overdue assignment exists and it's Day 1, prioritize immediate catch-up
        if (dayIndex === 1 && priorities.some((p) => p.isOverdue)) {
          const overdueItem = priorities.find((p) => p.isOverdue);
          if (overdueItem) {
            suggestedTasks.push(`[Urgent Priority] Catch-up on overdue item: "${overdueItem.title}"`);
          }
        }

        // Add pedagogical study suggestions based on focus and profile
        if (dayIndex % 2 === 1) {
          suggestedTasks.push(`Suggested Study: Review core theoretical concepts of ${defaultFocusTopic} (50 mins)`);
          suggestedTasks.push(`Suggested Practice: Solve targeted practice exercises & code implementations (40 mins)`);
        } else {
          suggestedTasks.push(`Suggested Revision: Recap previous topics and review lecture notes (45 mins)`);
          suggestedTasks.push(`Suggested Assessment: Self-quiz and problem solving on ${defaultFocusTopic} (30 mins)`);
        }

        schedule.push({
          day: dayIndex,
          date: dateString,
          focusTopic: defaultFocusTopic,
          suggestedTasks,
        });
      }

      return {
        success: true,
        days,
        focus: focus || undefined,
        student: {
          name: studentName,
          course: studentCourse,
          semester: studentSemester,
        },
        priorities,
        upcomingDeadlines,
        schedule,
        relevantNotes: relevantNotes.length > 0 ? relevantNotes : undefined,
        hasRealDatabaseAssignments: rawAssignments.length > 0,
        notesContextAvailable: relevantNotes.length > 0,
        message:
          rawAssignments.length === 0
            ? 'No pending assignments found in PostgreSQL. Generated structured study schedule based on student academic profile and focus.'
            : undefined,
      };
    } catch (dbError: any) {
      console.error('[TOOL:createStudyPlan] Error generating study plan:', dbError?.message || dbError);
      throw new Error('Failed to generate personalized study plan from student data.');
    }
  },
};
