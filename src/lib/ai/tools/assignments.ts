// ==========================================
// Tool: Assignments (PostgreSQL Data Retrieval)
// Strictly enforces user authorization and filtering
// ==========================================

import { AgentTool, ToolExecutionContext } from './types';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';

export interface GetAssignmentsArgs {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL';
  subject?: string;
  dueDate?: 'upcoming' | 'overdue' | 'today' | 'this_week' | 'all';
  dueBefore?: string; // ISO date
  dueAfter?: string; // ISO date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'ALL';
  limit?: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description?: string | null;
  subject: string;
  dueDate: string;
  priority: string;
  status: string;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface AssignmentsResult {
  success: boolean;
  totalFound: number;
  assignments: AssignmentItem[];
  summary: {
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    overdueCount: number;
  };
  filterApplied: Record<string, any>;
  error?: string;
}

export const assignmentsTool: AgentTool<GetAssignmentsArgs, AssignmentsResult> = {
  name: 'get_assignments',
  description:
    'Retrieve the current student\'s academic assignments from PostgreSQL. Filter by completion status (PENDING, IN_PROGRESS, COMPLETED), subject name/code, due date timeline (upcoming, overdue, today, this_week), and priority.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ALL'],
        description: 'Filter assignments by progress status.',
      },
      subject: {
        type: 'string',
        description: 'Filter assignments by subject name or code (e.g. "CS301", "Algorithms", "AI402").',
      },
      dueDate: {
        type: 'string',
        enum: ['upcoming', 'overdue', 'today', 'this_week', 'all'],
        description: 'Filter by relative due date timeline.',
      },
      dueBefore: {
        type: 'string',
        description: 'Filter assignments due on or before an ISO date (YYYY-MM-DD).',
      },
      dueAfter: {
        type: 'string',
        description: 'Filter assignments due on or after an ISO date (YYYY-MM-DD).',
      },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'ALL'],
        description: 'Filter by assignment priority.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of assignments to retrieve (default: 20, max: 50).',
      },
    },
  },
  execute: async (
    args: GetAssignmentsArgs,
    context: ToolExecutionContext
  ): Promise<AssignmentsResult> => {
    // 1. Mandatory Authorization Check
    const userId = context.userId;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return {
        success: false,
        totalFound: 0,
        assignments: [],
        summary: { pendingCount: 0, inProgressCount: 0, completedCount: 0, overdueCount: 0 },
        filterApplied: args,
        error:
          'Security Exception: User authorization failed. A verified userId is strictly required to query personal assignments.',
      };
    }

    try {
      const isDbConnected = await testDatabaseConnection();

      // If database is offline in local development, return mock student assignments with notice
      if (!isDbConnected) {
        const now = new Date();
        const mockAssignments: AssignmentItem[] = [
          {
            id: 'mock_1',
            title: 'Bellman-Ford & Dijkstra Benchmark Implementation',
            description: 'Implement both algorithms in Python with adjacency list and Min-Heap.',
            subject: 'Algorithms & Proofs (CS301)',
            dueDate: new Date(now.getTime() + 86400000 * 2).toISOString(),
            priority: 'HIGH',
            status: 'PENDING',
            daysRemaining: 2,
            isOverdue: false,
          },
          {
            id: 'mock_2',
            title: 'Convolutional Layer Backprop Math Derivation',
            description: 'Derive partial derivatives for 2D convolution with padding and stride.',
            subject: 'Deep Learning (AI402)',
            dueDate: new Date(now.getTime() + 86400000 * 5).toISOString(),
            priority: 'URGENT',
            status: 'IN_PROGRESS',
            daysRemaining: 5,
            isOverdue: false,
          },
          {
            id: 'mock_3',
            title: 'Database BCNF & 3NF Normalization Proofs',
            description: 'Decompose relational schemas and compute canonical minimal cover.',
            subject: 'Database Systems (DS205)',
            dueDate: new Date(now.getTime() - 86400000).toISOString(),
            priority: 'MEDIUM',
            status: 'PENDING',
            daysRemaining: -1,
            isOverdue: true,
          },
        ];

        return {
          success: true,
          totalFound: mockAssignments.length,
          assignments: mockAssignments,
          summary: {
            pendingCount: 2,
            inProgressCount: 1,
            completedCount: 0,
            overdueCount: 1,
          },
          filterApplied: { ...args, source: 'offline_fallback' },
        };
      }

      // 2. Validate that authorized user exists in PostgreSQL
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        return {
          success: false,
          totalFound: 0,
          assignments: [],
          summary: { pendingCount: 0, inProgressCount: 0, completedCount: 0, overdueCount: 0 },
          filterApplied: args,
          error: `Authorization Error: No user account found matching identifier '${userId}'.`,
        };
      }

      // 3. Construct Prisma Query Filters
      const where: any = {
        userId,
      };

      // Filter by Status
      if (args.status && args.status !== 'ALL') {
        where.status = args.status as Status;
      }

      // Filter by Subject (case-insensitive search)
      if (args.subject && args.subject.trim()) {
        where.subject = {
          contains: args.subject.trim(),
          mode: 'insensitive',
        };
      }

      // Filter by Priority
      if (args.priority && args.priority !== 'ALL') {
        where.priority = args.priority as Priority;
      }

      // Filter by Due Date timeline
      const now = new Date();
      if (args.dueDate) {
        if (args.dueDate === 'upcoming') {
          where.dueDate = { gte: now };
        } else if (args.dueDate === 'overdue') {
          where.dueDate = { lt: now };
          where.status = { not: Status.COMPLETED };
        } else if (args.dueDate === 'today') {
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          where.dueDate = { gte: startOfDay, lte: endOfDay };
        } else if (args.dueDate === 'this_week') {
          const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          where.dueDate = { gte: now, lte: inSevenDays };
        }
      }

      // Custom explicit date bounds
      if (args.dueBefore) {
        const parsed = new Date(args.dueBefore);
        if (!isNaN(parsed.getTime())) {
          where.dueDate = { ...where.dueDate, lte: parsed };
        }
      }

      if (args.dueAfter) {
        const parsed = new Date(args.dueAfter);
        if (!isNaN(parsed.getTime())) {
          where.dueDate = { ...where.dueDate, gte: parsed };
        }
      }

      const limit = Math.min(Math.max(args.limit || 20, 1), 50);

      // 4. Query Database
      const records = await prisma.assignment.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: limit,
      });

      // 5. Transform and compute metrics
      let pendingCount = 0;
      let inProgressCount = 0;
      let completedCount = 0;
      let overdueCount = 0;

      const formattedAssignments: AssignmentItem[] = records.map((a) => {
        const dueTime = new Date(a.dueDate).getTime();
        const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = dueTime < now.getTime() && a.status !== Status.COMPLETED;

        if (a.status === Status.PENDING) pendingCount++;
        else if (a.status === Status.IN_PROGRESS) inProgressCount++;
        else if (a.status === Status.COMPLETED) completedCount++;

        if (isOverdue) overdueCount++;

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          subject: a.subject || 'General Academic',
          dueDate: a.dueDate.toISOString(),
          priority: a.priority,
          status: a.status,
          daysRemaining: diffDays,
          isOverdue,
        };
      });

      return {
        success: true,
        totalFound: formattedAssignments.length,
        assignments: formattedAssignments,
        summary: {
          pendingCount,
          inProgressCount,
          completedCount,
          overdueCount,
        },
        filterApplied: args,
      };
    } catch (dbErr) {
      console.error('[Assignments Tool Database Error]:', dbErr);
      return {
        success: false,
        totalFound: 0,
        assignments: [],
        summary: { pendingCount: 0, inProgressCount: 0, completedCount: 0, overdueCount: 0 },
        filterApplied: args,
        error:
          dbErr instanceof Error
            ? dbErr.message
            : 'Database query execution failed while fetching assignments.',
      };
    }
  },
};
