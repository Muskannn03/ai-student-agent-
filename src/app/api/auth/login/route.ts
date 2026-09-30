import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, hashPassword, AUTH_COOKIE_NAME } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { studentProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Verify password:
    // If user has a hashed password, verify it.
    // If user has no password stored yet (e.g. seeded demo user), update with their new password!
    let isValid = false;
    if (user.password) {
      isValid = verifyPassword(password, user.password);
    } else {
      // Legacy or seed account without password: set their password now
      const newHash = hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    // Create session token and set HTTP-only cookie
    const token = createSessionToken(user.id, user.email, user.name);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.studentProfile?.course,
        semester: user.studentProfile?.semester,
      },
    });
  } catch (error) {
    console.error('[API /api/auth/login error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed.',
      },
      { status: 500 }
    );
  }
}
