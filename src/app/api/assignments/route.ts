import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { mockAssignments } from '@/lib/mock-data';
import { Priority, Status } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      let filtered = mockAssignments;
      if (statusParam && statusParam !== 'ALL') {
        filtered = mockAssignments.filter((a) => a.status === statusParam);
      }
      return NextResponse.json({ success: true, data: filtered, source: 'mock' });
    }

    const assignments = await prisma.assignment.findMany({
      where: statusParam && statusParam !== 'ALL' ? { status: statusParam as Status } : undefined,
      include: { subjectRef: true },
      orderBy: { dueDate: 'asc' },
    });

    const formatted = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description || undefined,
      dueDate: a.dueDate.toISOString(),
      priority: a.priority,
      status: a.status,
      courseCode: a.subjectRef?.name?.split(' ')[0] || a.subject || 'GEN',
      courseName: a.subjectRef?.name || a.subject || 'General',
      colorHex: '#6366f1',
      score: undefined,
      totalPoints: 100,
    }));

    return NextResponse.json({ success: true, data: formatted, source: 'database' });
  } catch (error) {
    console.error('[API /api/assignments error]:', error);
    return NextResponse.json({
      success: true,
      data: mockAssignments,
      error: error instanceof Error ? error.message : 'Database error',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, subject, dueDate, priority } = body;

    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        message: 'Assignment recorded in local state (connect PostgreSQL for persistent storage).',
      });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: 'No student user found' }, { status: 404 });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        userId: user.id,
        title,
        description,
        subject,
        dueDate: new Date(dueDate || Date.now() + 86400000),
        priority: (priority as Priority) || Priority.MEDIUM,
        status: Status.PENDING,
      },
    });

    return NextResponse.json({ success: true, data: newAssignment });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
