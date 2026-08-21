import { PancakeApiService } from '../services/pancake-api.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

async function main() {
  logger.info('Starting manual Pancake historical backfill script...');

  const pageIds = env.PANCAKE_PAGE_IDS.split(',').map((id) => id.trim()).filter(Boolean);

  if (pageIds.length === 0) {
    logger.warn('No PANCAKE_PAGE_IDS specified in .env. Please set PANCAKE_PAGE_IDS="page_1,page_2"');
    process.exit(1);
  }

  let totalProcessed = 0;
  for (const pageId of pageIds) {
    logger.info(`Fetching historical conversations for Page ID: ${pageId}`);
    const processed = await PancakeApiService.syncPageConversations(pageId);
    totalProcessed += processed;
  }

  logger.info(`Historical backfill complete! Total conversations processed: ${totalProcessed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  logger.error({ error: err.message }, 'Historical sync script failed');
  process.exit(1);
});
