import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// In Serverless / Lambda environments (Netlify, AWS Lambda), ensure SQLite DB is written to writable /tmp
let dbUrl = process.env.DATABASE_URL;
if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || !dbUrl) {
  if (!dbUrl || dbUrl.includes('./dev.db') || dbUrl === 'file:./dev.db') {
    dbUrl = 'file:/tmp/dev.db';
    process.env.DATABASE_URL = dbUrl;
  }
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: ['error', 'warn'],
});

prisma.$on('error' as never, (e: any) => {
  logger.error(e, 'Prisma Client Error');
});
