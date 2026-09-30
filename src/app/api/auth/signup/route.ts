import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, course, semester, college } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Hash password & create user with StudentProfile
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        studentProfile: {
          create: {
            course: course?.trim() || 'Computer Science',
            semester: semester ? Number(semester) : 1,
            college: college?.trim() || 'Engineering & Sciences',
            skills: [],
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

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
      message: 'Account created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.studentProfile?.course,
        semester: user.studentProfile?.semester,
      },
    });
  } catch (error) {
    console.error('[API /api/auth/signup error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account.',
      },
      { status: 500 }
    );
  }
}
