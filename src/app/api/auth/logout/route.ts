import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to log out.' },
      { status: 500 }
    );
  }
}
