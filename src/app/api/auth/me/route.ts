import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getAuthenticatedUser(false);

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      select: { name: true },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.studentProfile?.course || 'Computer Science',
        semester: user.studentProfile?.semester || 1,
        college: user.studentProfile?.college || 'University',
        skills: user.studentProfile?.skills || [],
        careerGoals: user.studentProfile?.careerGoals || undefined,
        subjects: subjects.map((s) => s.name),
      },
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
