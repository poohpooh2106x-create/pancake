import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { PancakeApiService } from './pancake-api.service';

export class SyncSchedulerService {
  private static task: cron.ScheduledTask | null = null;

  /**
   * Start scheduled background polling
   */
  public static start(): void {
    if (!env.FALLBACK_SYNC_ENABLED) {
      logger.info('Fallback Polling Scheduler is disabled by configuration.');
      return;
    }

    if (!env.PANCAKE_PAGE_IDS) {
      logger.warn('Fallback Polling is enabled but no PANCAKE_PAGE_IDS configured.');
      return;
    }

    const pageIds = env.PANCAKE_PAGE_IDS.split(',').map((id) => id.trim()).filter(Boolean);

    if (pageIds.length === 0) {
      return;
    }

    logger.info(
      { cron: env.FALLBACK_SYNC_CRON, pageIds },
      'Initializing Pancake Fallback Polling Scheduler'
    );

    this.task = cron.schedule(env.FALLBACK_SYNC_CRON, async () => {
      logger.info('Executing scheduled Pancake conversation fallback sync...');
      for (const pageId of pageIds) {
        try {
          await PancakeApiService.syncPageConversations(pageId);
        } catch (error: any) {
          logger.error({ error: error.message, pageId }, 'Error in scheduled page sync');
        }
      }
    });
  }

  /**
   * Stop scheduled background polling
   */
  public static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Stopped Pancake Fallback Polling Scheduler');
    }
  }
}
