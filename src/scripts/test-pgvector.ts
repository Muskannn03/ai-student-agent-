import { prisma } from '../lib/prisma';

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Connected to PostgreSQL:', res);

    try {
      await prisma.$queryRaw`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log('PGVECTOR_STATUS: AVAILABLE AND ENABLED');
    } catch (e: any) {
      console.log('PGVECTOR_STATUS: NOT_SUPPORTED', e.message);
    }
  } catch (err: any) {
    console.log('DATABASE_CONNECTION_ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
