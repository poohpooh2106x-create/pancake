import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';
import { SyncSchedulerService } from './services/sync-scheduler.service';

async function bootstrap() {
  try {
    // 1. Connect to Database
    await prisma.$connect();
    logger.info('Connected to database successfully');

    // 2. Start Sync Scheduler (if enabled)
    SyncSchedulerService.start();

    // 3. Start Express Server
    const app = createApp();
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        `🚀 Pancake Customer Extraction Service listening at http://${env.HOST}:${env.PORT}`
      );
      logger.info(`Webhook Endpoint: POST http://${env.HOST}:${env.PORT}/api/webhooks/pancake`);
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      SyncSchedulerService.stop();
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server and database connections closed cleanly');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.fatal({ error: error.message, stack: error.stack }, 'Application failed to start');
    process.exit(1);
  }
}

bootstrap();
