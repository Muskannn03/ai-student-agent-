import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'aisa_session';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'aisa-student-agent-secret-key-salt-2026';
export const TOKEN_EXPIRY_DAYS = 30;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}

/**
 * Hashes a plaintext password using PBKDF2 with a secure random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [salt, originalHash] = parts;
  const testHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(originalHash, 'hex'),
    Buffer.from(testHash, 'hex')
  );
}

/**
 * Generates a signed session token for a user.
 */
export function createSessionToken(userId: string, email: string, name: string): string {
  const expiresAt = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = { userId, email, name, expiresAt };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

/**
 * Validates and decodes a signed session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    ) as SessionPayload;

    if (payload.expiresAt < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
