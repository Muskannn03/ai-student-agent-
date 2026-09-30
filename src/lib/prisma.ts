import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Check if the database connection is healthy
 */
export async function testDatabaseConnection(): Promise<boolean> {
  if (!env.isDatabaseConfigured) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('[Prisma] Database connection test failed:', error);
    return false;
  }
}

export default prisma;
