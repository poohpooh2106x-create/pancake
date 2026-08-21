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

let isInitialized = false;

/**
 * Ensure all SQLite tables exist automatically (Required for Netlify Serverless /tmp/dev.db)
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (isInitialized) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Customer (
        id TEXT PRIMARY KEY,
        pancakeCustomerId TEXT UNIQUE,
        pageId TEXT,
        platform TEXT DEFAULT 'FACEBOOK',
        leadSource TEXT DEFAULT 'FB เคพีศรีราชา',
        name TEXT NOT NULL,
        avatarUrl TEXT,
        profileUrl TEXT,
        gender TEXT,
        primaryPhone TEXT,
        interestedVehicle TEXT,
        assignedSales TEXT,
        receivedDate TEXT,
        receivedTime TEXT,
        assignedAdminName TEXT,
        assignedAdminId TEXT,
        leadStatus TEXT DEFAULT 'NEW',
        tags TEXT DEFAULT '[]',
        notes TEXT,
        firstContactAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastContactAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        totalMessages INTEGER DEFAULT 0,
        totalOrders INTEGER DEFAULT 0,
        totalSpent REAL DEFAULT 0.0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS CustomerPhone (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        e164Format TEXT,
        rawExtracted TEXT NOT NULL,
        carrier TEXT,
        isPrimary BOOLEAN DEFAULT 0,
        sourceMessageId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Message (
        id TEXT PRIMARY KEY,
        pancakeMessageId TEXT UNIQUE,
        conversationId TEXT NOT NULL,
        customerId TEXT NOT NULL,
        senderType TEXT NOT NULL,
        text TEXT NOT NULL,
        extractedPhones TEXT DEFAULT '[]',
        sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        id TEXT PRIMARY KEY,
        pancakeOrderId TEXT UNIQUE,
        customerId TEXT NOT NULL,
        orderCode TEXT,
        totalAmount REAL DEFAULT 0.0,
        status TEXT NOT NULL,
        itemsSummary TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS WebhookEventLog (
        id TEXT PRIMARY KEY,
        eventId TEXT,
        pageId TEXT,
        eventType TEXT NOT NULL,
        platform TEXT,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'SUCCESS',
        errorMessage TEXT,
        processingTimeMs INTEGER,
        isProcessed BOOLEAN DEFAULT 1,
        receivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isInitialized = true;
    logger.info('Database schema verified & ready.');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed during ensureDatabaseSchema');
  }
}
