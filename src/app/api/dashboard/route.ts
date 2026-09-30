import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { computeDashboardMetrics } from '@/lib/db-utils';
import { getAuthenticatedUser } from '@/lib/auth/auth';

export async function GET() {
  try {
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        data: null,
        source: 'offline',
        message: 'PostgreSQL database disconnected.',
      });
    }

    // Query active authenticated student user and relations from PostgreSQL
    const user = await getAuthenticatedUser(true);

    if (!user) {
      return NextResponse.json({
        success: true,
        data: null,
        source: 'no_user',
      });
    }

    // Fetch user's active assignments
    const userAssignments = await prisma.assignment.findMany({
      where: { userId: user.id },
      orderBy: { dueDate: 'asc' },
      take: 6,
      include: { subjectRef: true },
    });

    // Fetch user's class timetables
    const userTimetables = await prisma.timetable.findMany({
      where: { userId: user.id },
      take: 6,
      include: { subject: true },
    });

    // Fetch user's uploaded lecture notes
    const userNotes = await prisma.noteDocument.findMany({
      where: { userId: user.id },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });

    // Compute live metrics from database
    const computed = await computeDashboardMetrics(user.id);

    // Format assignments
    const upcomingAssignments = userAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description || undefined,
      dueDate: a.dueDate.toISOString(),
      priority: a.priority,
      status: a.status,
      courseCode: a.subjectRef?.name?.split(' ')[0] || a.subject || 'GEN',
      courseName: a.subjectRef?.name || a.subject || 'General Coursework',
      colorHex: '#800020',
      totalPoints: 100,
    }));

    // Format schedule
    const todaySchedule = userTimetables.map((t) => ({
      id: t.id,
      day: t.day,
      startTime: t.startTime,
      endTime: t.endTime,
      courseName: t.subject?.name || 'Class',
      courseCode: t.subject?.name?.split(' ')[0] || 'LEC',
      location: 'Lecture Hall',
      type: 'LECTURE' as const,
      colorHex: '#800020',
    }));

    // Format recent notes
    const recentNotes = userNotes.map((n) => ({
      id: n.id,
      title: n.title,
      courseName: n.subject || 'Coursework',
      summary: `Document processed with ${n._count.chunks} semantic vector chunks.`,
      tags: [n.subject || 'Notes'],
      date: n.createdAt.toISOString().split('T')[0],
      isUploadedPdf: true,
      fileSize: n.fileSize,
      pageCount: n.pageCount,
    }));

    // Format study sprint tasks from active assignments
    const pendingTasks = upcomingAssignments.filter((a) => a.status !== 'COMPLETED');
    const studyTasks = pendingTasks.slice(0, 4).map((a) => ({
      id: `task_${a.id}`,
      title: `Review & complete: ${a.title}`,
      durationMinutes: 45,
      isCompleted: false,
      subject: a.courseName,
    }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: '',
          major: user.studentProfile?.course || 'Computer Science',
          semester: user.studentProfile?.semester || 1,
          gpa: 3.8,
        },
        metrics: {
          gpa: 3.8,
          targetGpa: 3.9,
          pendingAssignmentsCount: computed.pendingAssignments,
          completedAssignmentsCount: computed.completedAssignments,
          weeklyStudyHoursCompleted: computed.weeklyStudyHours || 0,
          weeklyStudyHoursTarget: 15,
          todayClassesCount: todaySchedule.length,
          activeCoursesCount: userAssignments.length > 0 ? new Set(userAssignments.map(a => a.subject)).size : 1,
        },
        upcomingAssignments,
        todaySchedule,
        recentNotes,
        studyPlan: {
          id: 'sp_live',
          title: 'Active Study Sprint',
          targetHours: 15,
          completedHours: computed.weeklyStudyHours || 0,
          tasks: studyTasks,
        },
      },
      source: 'database',
    });
  } catch (error) {
    console.error('[API /api/dashboard error]:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Database query error',
    });
  }
}
