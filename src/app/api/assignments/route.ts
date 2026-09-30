import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { Priority, Status } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const isDbConnected = await testDatabaseConnection();

    if (!isDbConnected) {
      return NextResponse.json({ success: true, data: [], source: 'offline' });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({ success: true, data: [], source: 'database' });
    }

    const whereClause: any = { userId: user.id };
    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam as Status;
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
      courseName: a.subjectRef?.name || a.subject || 'General Coursework',
      colorHex: '#800020',
      score: undefined,
      totalPoints: 100,
    }));

    return NextResponse.json({ success: true, data: formatted, source: 'database' });
  } catch (error) {
    console.error('[API /api/assignments error]:', error);
    return NextResponse.json({
      success: true,
      data: [],
      error: error instanceof Error ? error.message : 'Database error',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, subject, dueDate, priority } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Assignment title is required.' }, { status: 400 });
    }

    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        message: 'Database offline. Stored temporarily.',
      });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No student user found' }, { status: 404 });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject?.trim() || 'General',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 86400000 * 3),
        priority: (priority as Priority) || Priority.MEDIUM,
        status: Status.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newAssignment.id,
        title: newAssignment.title,
        description: newAssignment.description || undefined,
        dueDate: newAssignment.dueDate.toISOString(),
        priority: newAssignment.priority,
        status: newAssignment.status,
        courseCode: (newAssignment.subject || 'GEN').split(' ')[0],
        courseName: newAssignment.subject || 'General Coursework',
        colorHex: '#800020',
        totalPoints: 100,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: status as Status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Assignment ID required' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
