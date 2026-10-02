import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  AUTH_COOKIE_NAME,
  SESSION_SECRET,
  TOKEN_EXPIRY_DAYS,
  SessionPayload,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from './token';

export {
  AUTH_COOKIE_NAME,
  SESSION_SECRET,
  TOKEN_EXPIRY_DAYS,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
};
export type { SessionPayload };

/**
 * Retrieves the currently authenticated user from Next.js cookies,
 * or gracefully falls back to the primary user if allowFallback is true.
 */
export async function getAuthenticatedUser(allowFallback: boolean = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { studentProfile: true },
        });
        if (user) return user;
      }
    }

    if (allowFallback) {
      // Used by backend agent endpoints when invoked from background test scripts
      return await prisma.user.findFirst({
        include: { studentProfile: true },
      });
    }

    return null;
  } catch (error) {
    console.warn('[getAuthenticatedUser error]:', error);
    if (allowFallback) {
      return await prisma.user.findFirst({
        include: { studentProfile: true },
      });
    }
    return null;
  }
}
