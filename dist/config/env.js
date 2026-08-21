"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform((val) => parseInt(val, 10)).default('3000'),
    HOST: zod_1.z.string().default('0.0.0.0'),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // Database
    DATABASE_URL: zod_1.z.string().default('file:./dev.db'),
    // Pancake Integration
    PANCAKE_WEBHOOK_SECRET: zod_1.z.string().default(''),
    PANCAKE_API_ACCESS_TOKEN: zod_1.z.string().default(''),
    PANCAKE_API_BASE_URL: zod_1.z.string().default('https://pages.fm/api/v1'),
    PANCAKE_PAGE_IDS: zod_1.z.string().default(''),
    // Google Sheets Integration
    GOOGLE_SHEETS_ENABLED: zod_1.z.string().transform((val) => val === 'true').default('false'),
    GOOGLE_SHEETS_SPREADSHEET_ID: zod_1.z.string().default(''),
    GOOGLE_SHEETS_SHEET_NAME: zod_1.z.string().default('Pancake Customers'),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: zod_1.z.string().default(''),
    GOOGLE_PRIVATE_KEY: zod_1.z.string().default(''),
    // Fallback Polling Scheduler
    FALLBACK_SYNC_ENABLED: zod_1.z.string().transform((val) => val === 'true').default('false'),
    FALLBACK_SYNC_CRON: zod_1.z.string().default('*/30 * * * *'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map