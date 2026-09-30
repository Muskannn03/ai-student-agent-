import { PrismaClient } from '@prisma/client';

// Load environment variables
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch {
  // ignore
}

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection via Prisma ORM...');
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`📌 Target URL: ${maskedUrl}`);

  try {
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version();`;
    console.log('✅ Connected successfully to PostgreSQL database!');
    console.log('📊 Server Details:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : error);
    console.log('\n💡 Tip: Update DATABASE_URL in .env.local with your PostgreSQL password:');
    console.log('   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_student_agent?schema=public"\n');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
