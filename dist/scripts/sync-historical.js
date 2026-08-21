"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pancake_api_service_1 = require("../services/pancake-api.service");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const prisma_1 = require("../db/prisma");
async function main() {
    logger_1.logger.info('Starting manual Pancake historical backfill script...');
    const pageIds = env_1.env.PANCAKE_PAGE_IDS.split(',').map((id) => id.trim()).filter(Boolean);
    if (pageIds.length === 0) {
        logger_1.logger.warn('No PANCAKE_PAGE_IDS specified in .env. Please set PANCAKE_PAGE_IDS="page_1,page_2"');
        process.exit(1);
    }
    let totalProcessed = 0;
    for (const pageId of pageIds) {
        logger_1.logger.info(`Fetching historical conversations for Page ID: ${pageId}`);
        const processed = await pancake_api_service_1.PancakeApiService.syncPageConversations(pageId);
        totalProcessed += processed;
    }
    logger_1.logger.info(`Historical backfill complete! Total conversations processed: ${totalProcessed}`);
    await prisma_1.prisma.$disconnect();
}
main().catch((err) => {
    logger_1.logger.error({ error: err.message }, 'Historical sync script failed');
    process.exit(1);
});
//# sourceMappingURL=sync-historical.js.map