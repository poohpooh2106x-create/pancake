import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().default('file:./dev.db'),

  // Pancake Integration
  PANCAKE_WEBHOOK_SECRET: z.string().default(''),
  PANCAKE_API_ACCESS_TOKEN: z.string().default(''),
  PANCAKE_API_BASE_URL: z.string().default('https://pages.fm/api/v1'),
  PANCAKE_PAGE_IDS: z.string().default(''),

  // Google Sheets Integration
  GOOGLE_SHEETS_ENABLED: z.string().transform((val) => val === 'true').default('false'),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().default(''),
  GOOGLE_SHEETS_SHEET_NAME: z.string().default('Pancake Customers'),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().default(''),
  GOOGLE_PRIVATE_KEY: z.string().default(''),

  // Fallback Polling Scheduler
  FALLBACK_SYNC_ENABLED: z.string().transform((val) => val === 'true').default('false'),
  FALLBACK_SYNC_CRON: z.string().default('*/30 * * * *'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
