// ==========================================
// Reusable PostgreSQL Database Utilities
// Powered by Prisma ORM
// ==========================================

import { prisma, testDatabaseConnection } from './prisma';
import { Priority, Status, SessionStatus, DayOfWeek, MessageRole } from '@prisma/client';

/**
 * Fetch a student user and their linked student profile
 */
export async function getUserWithProfile(emailOrId: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ id: emailOrId }, { email: emailOrId }],
    },
    include: {
      studentProfile: true,
      subjects: true,
    },
  });
}

/**
 * Fetch or create the default development student
 */
export async function getOrCreateDefaultStudent() {
  const existing = await prisma.user.findFirst({
    include: {
      studentProfile: true,
      subjects: true,
    },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
      studentProfile: {
        create: {
          college: 'School of Computing & AI',
          course: 'B.Tech Computer Science & AI',
          semester: 4,
          skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'PostgreSQL'],
          careerGoals: 'AI/ML Software Engineer',
        },
      },
    },
    include: {
      studentProfile: true,
      subjects: true,
    },
  });
}

/**
 * Fetch student assignments with optional status filtering
 */
export async function getStudentAssignments(userId: string, status?: Status) {
  return prisma.assignment.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: {
      subjectRef: true,
    },
    orderBy: {
      dueDate: 'asc',
    },
  });
}

/**
 * Create a new assignment
 */
export async function createAssignment(data: {
  userId: string;
  title: string;
  description?: string;
  subject?: string;
  subjectId?: string;
  dueDate: Date;
  priority?: Priority;
}) {
  return prisma.assignment.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      subject: data.subject,
      subjectId: data.subjectId,
      dueDate: data.dueDate,
      priority: data.priority || Priority.MEDIUM,
      status: Status.PENDING,
    },
  });
}

/**
 * Update an assignment's status
 */
export async function updateAssignmentStatus(id: string, status: Status) {
  return prisma.assignment.update({
    where: { id },
    data: { status },
  });
}

/**
 * Fetch weekly timetable grouped or filtered by day
 */
export async function getStudentTimetable(userId: string, day?: DayOfWeek) {
  return prisma.timetable.findMany({
    where: {
      userId,
      ...(day ? { day } : {}),
    },
    include: {
      subject: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

/**
 * Fetch recent study sessions
 */
export async function getRecentStudySessions(userId: string, limit: number = 5) {
  return prisma.studySession.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/**
 * Log or record a new study session
 */
export async function recordStudySession(data: {
  userId: string;
  subjectId: string;
  topic: string;
  duration: number;
  date?: Date;
  status?: SessionStatus;
}) {
  return prisma.studySession.create({
    data: {
      userId: data.userId,
      subjectId: data.subjectId,
      topic: data.topic,
      duration: data.duration,
      date: data.date || new Date(),
      status: data.status || SessionStatus.COMPLETED,
    },
  });
}

/**
 * Get or create an active chat session for a student
 */
export async function getOrCreateChatSession(userId: string, title?: string) {
  const latestSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (latestSession) return latestSession;

  return prisma.chatSession.create({
    data: {
      userId,
      title: title || 'Academic Study Assistant',
    },
    include: {
      messages: true,
    },
  });
}

/**
 * Append a chat message to a chat session
 */
export async function saveChatMessage(chatSessionId: string, role: MessageRole, content: string) {
  return prisma.chatMessage.create({
    data: {
      chatSessionId,
      role,
      content,
    },
  });
}

/**
 * Fetch computed metrics for student dashboard from PostgreSQL
 */
export async function computeDashboardMetrics(userId: string) {
  const [pendingCount, completedCount, studySessions] = await Promise.all([
    prisma.assignment.count({ where: { userId, status: { in: [Status.PENDING, Status.IN_PROGRESS] } } }),
    prisma.assignment.count({ where: { userId, status: Status.COMPLETED } }),
    prisma.studySession.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
        },
      },
    }),
  ]);

  const totalWeeklyMinutes = studySessions.reduce((acc, s) => acc + s.duration, 0);
  const weeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10;

  return {
    pendingAssignments: pendingCount,
    completedAssignments: completedCount,
    weeklyStudyHours: weeklyHours,
  };
}
