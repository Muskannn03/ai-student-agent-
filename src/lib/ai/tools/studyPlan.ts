// ==========================================
// Tool: Study Plan Generator
// Synthesizes subjects, hours, assignment deadlines, and priorities
// ==========================================

import { AgentTool, ToolExecutionContext } from './types';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { Status } from '@prisma/client';

export interface StudyPlanSubjectInput {
  name: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  currentTopic?: string;
}

export interface AssignmentDeadlineInput {
  title: string;
  subject: string;
  dueDate: string; // ISO date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface CreateStudyPlanArgs {
  subjects: Array<string | StudyPlanSubjectInput>;
  availableStudyHours: number;
  assignmentDeadlines?: AssignmentDeadlineInput[];
  priorities?: string[]; // Array of subject names or focus areas
  daysCount?: number; // Number of days in sprint (default: 5)
  includeUpcomingAssignments?: boolean;
}

export interface DailyScheduleBlock {
  timeBlock: string;
  subject: string;
  durationMinutes: number;
  focusTopic: string;
  technique: string;
}

export interface DayPlan {
  dayNumber: number;
  dayLabel: string;
  totalHours: number;
  sessions: DailyScheduleBlock[];
  dailyMilestone: string;
}

export interface StudyPlanResult {
  success: boolean;
  totalStudyHours: number;
  daysCount: number;
  dailyAverageHours: number;
  subjectAllocations: Array<{
    subject: string;
    allocatedHours: number;
    percentage: number;
    priority: string;
    rationale: string;
  }>;
  schedule: DayPlan[];
  urgentDeadlinesConsidered: Array<{
    title: string;
    subject: string;
    dueDate: string;
    daysRemaining: number;
  }>;
  methodologyTips: string[];
  error?: string;
}

export const studyPlanTool: AgentTool<CreateStudyPlanArgs, StudyPlanResult> = {
  name: 'create_study_plan',
  description:
    'Generate an optimized, realistic academic study plan and revision timetable based on enrolled subjects, total available study hours, assignment deadlines, and subject priorities. Breaks work into Pomodoro sessions and daily milestones.',
  parameters: {
    type: 'object',
    properties: {
      subjects: {
        type: 'array',
        description: 'List of subjects to include in the study plan (strings or subject objects).',
        items: {
          type: 'string',
        },
      },
      availableStudyHours: {
        type: 'number',
        description: 'Total number of study hours available across the study plan timeframe (e.g. 15, 20).',
      },
      assignmentDeadlines: {
        type: 'array',
        description: 'Optional list of relevant assignments and their due dates to accommodate.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            subject: { type: 'string' },
            dueDate: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          },
          required: ['title', 'subject', 'dueDate'],
        },
      },
      priorities: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of subject names or areas that require high priority focus.',
      },
      daysCount: {
        type: 'number',
        description: 'Number of days to span the plan over (e.g. 3, 5, 7, 14). Default is 5.',
      },
      includeUpcomingAssignments: {
        type: 'boolean',
        description:
          'If true and user is authenticated, automatically fetch pending assignments from PostgreSQL.',
      },
    },
    required: ['subjects', 'availableStudyHours'],
  },
  execute: async (
    args: CreateStudyPlanArgs,
    context: ToolExecutionContext
  ): Promise<StudyPlanResult> => {
    try {
      // 1. Validate Arguments
      if (!args.subjects || !Array.isArray(args.subjects) || args.subjects.length === 0) {
        throw new Error('At least one subject is required to generate a study plan.');
      }

      const totalHours = Number(args.availableStudyHours);
      if (isNaN(totalHours) || totalHours <= 0) {
        throw new Error('availableStudyHours must be a positive number greater than 0.');
      }

      const daysCount = Math.min(Math.max(args.daysCount || 5, 1), 30);
      const dailyAverageHours = Number((totalHours / daysCount).toFixed(1));

      // 2. Normalize Subjects
      const parsedSubjects: StudyPlanSubjectInput[] = args.subjects.map((s) => {
        if (typeof s === 'string') {
          const isHighPriority = args.priorities?.some(
            (p) => p.toLowerCase() === s.toLowerCase()
          );
          return {
            name: s.trim(),
            priority: isHighPriority ? 'HIGH' : 'MEDIUM',
          };
        }
        return s;
      });

      // 3. Gather Deadlines (Supplied + optionally from PostgreSQL)
      const deadlines: AssignmentDeadlineInput[] = [...(args.assignmentDeadlines || [])];

      if (args.includeUpcomingAssignments !== false && context.userId) {
        try {
          const isDbConnected = await testDatabaseConnection();
          if (isDbConnected) {
            const dbAssignments = await prisma.assignment.findMany({
              where: {
                userId: context.userId,
                status: { not: Status.COMPLETED },
                dueDate: { gte: new Date() },
              },
              take: 10,
            });

            for (const a of dbAssignments) {
              if (!deadlines.some((d) => d.title.toLowerCase() === a.title.toLowerCase())) {
                deadlines.push({
                  title: a.title,
                  subject: a.subject || 'Academic Task',
                  dueDate: a.dueDate.toISOString(),
                  priority: a.priority,
                });
              }
            }
          }
        } catch (dbErr) {
          console.warn('[Study Plan Tool] Could not fetch DB assignments:', dbErr);
        }
      }

      // 4. Calculate Weight & Time Allocation for Each Subject
      const now = new Date();
      const urgentDeadlinesConsidered: StudyPlanResult['urgentDeadlinesConsidered'] = [];

      const subjectWeights = parsedSubjects.map((sub) => {
        let weight = 1.0;
        let rationale = 'Standard baseline allocation';

        // Priority weighting
        if (sub.priority === 'URGENT') {
          weight += 2.5;
          rationale = 'Urgent priority course';
        } else if (sub.priority === 'HIGH') {
          weight += 1.5;
          rationale = 'High priority focus area';
        } else if (sub.priority === 'LOW') {
          weight = 0.6;
          rationale = 'Maintenance review';
        }

        // Deadline weighting
        const matchingDeadlines = deadlines.filter((d) =>
          d.subject.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(d.subject.toLowerCase())
        );

        for (const dl of matchingDeadlines) {
          const dueTime = new Date(dl.dueDate).getTime();
          const daysLeft = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));

          urgentDeadlinesConsidered.push({
            title: dl.title,
            subject: dl.subject,
            dueDate: dl.dueDate,
            daysRemaining: daysLeft,
          });

          if (daysLeft <= 3 && daysLeft >= 0) {
            weight += 2.0;
            rationale += ` (Crucial deadline within ${daysLeft}d: ${dl.title})`;
          } else if (daysLeft <= 7 && daysLeft >= 0) {
            weight += 1.0;
            rationale += ` (Upcoming deadline: ${dl.title})`;
          }
        }

        return {
          subject: sub.name,
          priority: sub.priority || 'MEDIUM',
          weight,
          rationale,
        };
      });

      const totalWeight = subjectWeights.reduce((sum, item) => sum + item.weight, 0);

      const allocations = subjectWeights.map((item) => {
        const share = item.weight / totalWeight;
        const allocated = Number((share * totalHours).toFixed(1));
        return {
          subject: item.subject,
          allocatedHours: allocated,
          percentage: Math.round(share * 100),
          priority: item.priority,
          rationale: item.rationale,
        };
      });

      // 5. Generate Day-by-Day Pomodoro Timetable
      const schedule: DayPlan[] = [];
      const sessionLengthMinutes = 50; // 50m study + 10m break

      for (let day = 1; day <= daysCount; day++) {
        const dayHours = dailyAverageHours;
        const sessionsCount = Math.max(Math.round((dayHours * 60) / 60), 1);
        const daySessions: DailyScheduleBlock[] = [];

        for (let s = 0; s < sessionsCount; s++) {
          // Interleave subjects across sessions for higher cognitive retention
          const subjectIdx = (day + s) % allocations.length;
          const assignedSubject = allocations[subjectIdx];

          const blockStartHour = 10 + s * 2; // e.g. 10:00, 12:00, 14:00
          const timeBlock = `${blockStartHour}:00 - ${blockStartHour}:50`;

          let focusTopic = 'Active recall & concept breakdown';
          if (day === 1) focusTopic = 'Foundational concept map & formula review';
          else if (day === daysCount) focusTopic = 'Timed practice exam & error analysis';
          else if (s % 2 === 1) focusTopic = 'Assignment problem-solving & code debugging';

          daySessions.push({
            timeBlock,
            subject: assignedSubject.subject,
            durationMinutes: sessionLengthMinutes,
            focusTopic,
            technique: '50-10 Pomodoro (50m Focus, 10m Rest)',
          });
        }

        const primarySubject = daySessions[0]?.subject || allocations[0]?.subject;
        schedule.push({
          dayNumber: day,
          dayLabel: `Day ${day}`,
          totalHours: dayHours,
          sessions: daySessions,
          dailyMilestone: `Complete ${daySessions.length} core study blocks focusing on ${primarySubject} milestones.`,
        });
      }

      // 6. Return Structured Result
      return {
        success: true,
        totalStudyHours: totalHours,
        daysCount,
        dailyAverageHours,
        subjectAllocations: allocations,
        schedule,
        urgentDeadlinesConsidered,
        methodologyTips: [
          'Interleaving Technique: Alternate between subjects each session to strengthen neural associative memory.',
          'Active Recall: Test yourself with closed notes after every 50-minute block.',
          'Spaced Repetition: Spend the first 10 minutes of Day 2 reviewing concepts from Day 1.',
        ],
      };
    } catch (err) {
      return {
        success: false,
        totalStudyHours: 0,
        daysCount: 0,
        dailyAverageHours: 0,
        subjectAllocations: [],
        schedule: [],
        urgentDeadlinesConsidered: [],
        methodologyTips: [],
        error: err instanceof Error ? err.message : 'Failed to generate study plan.',
      };
    }
  },
};
