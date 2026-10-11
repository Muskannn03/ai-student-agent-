import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/auth';

export async function GET() {
  try {
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'sub_1', name: 'Data Structures & Algorithms', courseCode: 'CS301' },
          { id: 'sub_2', name: 'Operating Systems & Concurrency', courseCode: 'CS302' },
          { id: 'sub_3', name: 'Database Management Systems (DBMS)', courseCode: 'DS205' },
          { id: 'sub_4', name: 'Computer Networks', courseCode: 'CN304' },
          { id: 'sub_5', name: 'Artificial Intelligence & Machine Learning', courseCode: 'AI402' },
        ],
        source: 'cached',
      });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    });

    if (subjects.length === 0) {
      // Fallback defaults
      return NextResponse.json({
        success: true,
        data: [
          { id: 'sub_default_1', name: 'Algorithms & Proofs (CS301)', courseCode: 'CS301' },
          { id: 'sub_default_2', name: 'Deep Learning Architecture (AI402)', courseCode: 'AI402' },
          { id: 'sub_default_3', name: 'Database Systems (DS205)', courseCode: 'DS205' },
        ],
        source: 'defaults',
      });
    }

    return NextResponse.json({
      success: true,
      data: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        courseCode: s.name.split(' ')[0] || 'SUB',
        description: s.description,
      })),
      source: 'database',
    });
  } catch (error) {
    console.error('[API /api/subjects error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subjects',
      },
      { status: 500 }
    );
  }
}
