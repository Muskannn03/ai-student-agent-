import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { mockDashboardData } from '@/lib/mock-data';
import { computeDashboardMetrics } from '@/lib/db-utils';

export async function GET() {
  try {
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        data: mockDashboardData,
        source: 'mock',
        message: 'Using in-memory student mock data. Connect PostgreSQL to enable persistence.',
      });
    }

    // Query active student user and relations from PostgreSQL
    const user = await prisma.user.findFirst({
      include: {
        studentProfile: true,
        assignments: {
          take: 5,
          orderBy: { dueDate: 'asc' },
          include: { subjectRef: true },
        },
        timetables: {
          take: 5,
          include: { subject: true },
        },
        studySessions: {
          take: 4,
          orderBy: { date: 'desc' },
          include: { subject: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: mockDashboardData,
        source: 'mock_fallback',
      });
    }

    // Compute live metrics from database
    const computed = await computeDashboardMetrics(user.id);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: mockDashboardData.student.avatar,
          major: user.studentProfile?.course || 'Computer Science',
          semester: user.studentProfile?.semester || 4,
          gpa: 3.84,
        },
        metrics: {
          gpa: 3.84,
          targetGpa: 3.9,
          pendingAssignmentsCount: computed.pendingAssignments,
          completedAssignmentsCount: computed.completedAssignments,
          weeklyStudyHoursCompleted: computed.weeklyStudyHours || 12.5,
          weeklyStudyHoursTarget: 18,
          todayClassesCount: user.timetables.length,
          activeCoursesCount: 4,
        },
        upcomingAssignments: user.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description || undefined,
          dueDate: a.dueDate.toISOString(),
          priority: a.priority,
          status: a.status,
          courseCode: a.subjectRef?.name?.split(' ')[0] || a.subject || 'GEN',
          courseName: a.subjectRef?.name || a.subject || 'Coursework',
          colorHex: '#6366f1',
          totalPoints: 100,
        })),
        todaySchedule: user.timetables.map((t) => ({
          id: t.id,
          day: t.day,
          startTime: t.startTime,
          endTime: t.endTime,
          courseName: t.subject.name,
          courseCode: t.subject.name.split(' ')[0],
          location: 'Academic Hall',
          type: 'LECTURE' as const,
          colorHex: '#6366f1',
        })),
        recentNotes: mockDashboardData.recentNotes,
        studyPlan: mockDashboardData.studyPlan,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('[API /api/dashboard error]:', error);
    return NextResponse.json({
      success: true,
      data: mockDashboardData,
      source: 'fallback_on_error',
      error: error instanceof Error ? error.message : 'Database query error',
    });
  }
}
