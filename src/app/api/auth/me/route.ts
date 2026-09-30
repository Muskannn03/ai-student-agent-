import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser(false);

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

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
      },
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
