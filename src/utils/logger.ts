import pino from 'pino';
import { env } from '../config/env';

const isServerless = !!(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NODE_ENV === 'production'
);

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: !isServerless && env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
