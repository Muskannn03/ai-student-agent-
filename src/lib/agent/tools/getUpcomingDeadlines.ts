// ==========================================
// Tool: getUpcomingDeadlines
// Retrieves student's upcoming academic deadlines within a specified day window [now, now + days]
// ==========================================

import {
  AgentTool,
  AgentContext,
  GetUpcomingDeadlinesInput,
  GetUpcomingDeadlinesOutput,
  UpcomingDeadlineItem,
} from '../types';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

/**
 * Validates input for getUpcomingDeadlines tool at runtime.
 * Guarantees "days" is an integer between 1 and 30. Defaults to 7.
 */
export function validateGetUpcomingDeadlinesInput(rawInput: any): { days: number } {
  if (rawInput === undefined || rawInput === null || Object.keys(rawInput).length === 0) {
    return { days: 7 };
  }

  if (typeof rawInput !== 'object') {
    throw new Error('Validation error: expected an object.');
  }

  const rawDays = rawInput.days;
  if (rawDays === undefined || rawDays === null || rawDays === '') {
    return { days: 7 };
  }

  let daysNum: number;
  if (typeof rawDays === 'number') {
    daysNum = rawDays;
  } else if (typeof rawDays === 'string') {
    daysNum = parseInt(rawDays.trim(), 10);
  } else {
    throw new Error('Validation error: "days" must be an integer.');
  }

  if (isNaN(daysNum) || !Number.isInteger(daysNum)) {
    throw new Error('Validation error: "days" must be a valid integer.');
  }

  if (daysNum < 1) {
    throw new Error('Validation error: "days" must be at least 1.');
  }

  if (daysNum > 30) {
    throw new Error('Validation error: "days" cannot exceed 30.');
  }

  return { days: daysNum };
}

export const getUpcomingDeadlinesTool: AgentTool<GetUpcomingDeadlinesInput, GetUpcomingDeadlinesOutput> = {
  name: 'getUpcomingDeadlines',
  description: "Retrieve the current student's upcoming assignments and academic deadlines from PostgreSQL.",
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'integer',
        minimum: 1,
        maximum: 30,
        description: 'The number of days ahead to look for upcoming deadlines (1 to 30). Defaults to 7.',
      },
    },
  },
  execute: async (rawInput: GetUpcomingDeadlinesInput, context: AgentContext): Promise<GetUpcomingDeadlinesOutput> => {
    // 1. Runtime validation
    const { days } = validateGetUpcomingDeadlinesInput(rawInput);

    // 2. Enforce verified server-side userId from context (Never accept client-supplied userId)
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Security Exception: Verified userId in AgentContext is required to retrieve deadlines.');
    }

    // 3. Time handling
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    // 4. Query upcoming non-completed assignments within [now, endDate]
    try {
      const records = await prisma.assignment.findMany({
        where: {
          userId,
          status: { not: Status.COMPLETED },
          dueDate: {
            gte: now,
            lte: endDate,
          },
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

      // 5. Compact formatting for Llama 3.2
      const deadlines: UpcomingDeadlineItem[] = records.map((record) => ({
        id: record.id,
        title: record.title,
        description: record.description,
        subject: record.subject,
        dueDate: record.dueDate.toISOString(),
        priority: record.priority,
        status: record.status,
      }));

      return {
        total: deadlines.length,
        days,
        deadlines,
      };
    } catch (dbError: any) {
      console.error('[TOOL:getUpcomingDeadlines] Database retrieval error:', dbError?.message || dbError);
      throw new Error('Failed to retrieve upcoming academic deadlines from database.');
    }
  },
};
