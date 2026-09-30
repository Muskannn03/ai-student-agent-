// ==========================================
// Tool: getAssignments
// Retrieves student's assignments from PostgreSQL with status filtering and dynamic overdue detection
// ==========================================

import { AgentTool, AgentContext, GetAssignmentsInput, GetAssignmentsOutput, AssignmentItemSummary } from '../types';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

/**
 * Validates input for getAssignments tool at runtime.
 * Guarantees status is one of "pending" | "completed" | "overdue" | "all". Defaults to "all".
 */
export function validateGetAssignmentsInput(rawInput: any): GetAssignmentsInput {
  if (rawInput === undefined || rawInput === null || Object.keys(rawInput).length === 0) {
    return { status: 'all' };
  }

  if (typeof rawInput !== 'object') {
    throw new Error('Validation error: expected an object.');
  }

  const rawStatus = rawInput.status;
  if (rawStatus === undefined || rawStatus === null || rawStatus === '') {
    return { status: 'all' };
  }

  if (typeof rawStatus !== 'string') {
    throw new Error('Validation error: "status" must be a string.');
  }

  const normalized = rawStatus.trim().toLowerCase();
  const validStatuses: Array<'pending' | 'completed' | 'overdue' | 'all'> = [
    'pending',
    'completed',
    'overdue',
    'all',
  ];

  if (validStatuses.includes(normalized as any)) {
    return { status: normalized as 'pending' | 'completed' | 'overdue' | 'all' };
  }

  // Gracefully normalize common synonyms
  if (normalized.includes('pend') || (normalized.includes('due') && !normalized.includes('overdue')) || normalized.includes('active')) {
    return { status: 'pending' };
  }
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('finish')) {
    return { status: 'completed' };
  }
  if (normalized.includes('overdue') || normalized.includes('late') || normalized.includes('past')) {
    return { status: 'overdue' };
  }

  return { status: 'all' };
}

export const getAssignmentsTool: AgentTool<GetAssignmentsInput, GetAssignmentsOutput> = {
  name: 'getAssignments',
  description: "Retrieve the current student's assignments from PostgreSQL.",
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'overdue', 'all'],
        description: 'Filter assignments by status: "pending" for active tasks, "completed" for finished tasks, "overdue" for past-due tasks, or "all" to retrieve everything. Defaults to "all".',
      },
    },
  },
  execute: async (rawInput: GetAssignmentsInput, context: AgentContext): Promise<GetAssignmentsOutput> => {
    // 1. Runtime validation
    const input = validateGetAssignmentsInput(rawInput);

    // 2. Enforce verified server-side userId from context (Never trust client input)
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('Security Exception: Verified userId in AgentContext is required to retrieve assignments.');
    }

    const now = new Date();

    // 3. Status filtering
    const where: any = {
      userId,
    };

    if (input.status === 'pending') {
      where.status = Status.PENDING;
    } else if (input.status === 'completed') {
      where.status = Status.COMPLETED;
    } else if (input.status === 'overdue') {
      // Overdue dynamically: status != COMPLETED AND dueDate < current date/time
      where.status = { not: Status.COMPLETED };
      where.dueDate = { lt: now };
    }
    // "all" queries all assignments belonging to the student

    try {
      const records = await prisma.assignment.findMany({
        where,
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

      // 4. Compact formatting with dynamic overdue boolean
      const assignments: AssignmentItemSummary[] = records.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        dueDate: assignment.dueDate.toISOString(),
        priority: assignment.priority,
        status: assignment.status,
        overdue: assignment.status !== Status.COMPLETED && assignment.dueDate.getTime() < now.getTime(),
      }));

      return {
        total: assignments.length,
        assignments,
      };
    } catch (dbError: any) {
      console.error('[TOOL:getAssignments] Database retrieval error:', dbError?.message || dbError);
      throw new Error('Failed to retrieve student assignments from database.');
    }
  },
};
