"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncSchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const pancake_api_service_1 = require("./pancake-api.service");
class SyncSchedulerService {
    static task = null;
    /**
     * Start scheduled background polling
     */
    static start() {
        if (!env_1.env.FALLBACK_SYNC_ENABLED) {
            logger_1.logger.info('Fallback Polling Scheduler is disabled by configuration.');
            return;
        }
        if (!env_1.env.PANCAKE_PAGE_IDS) {
            logger_1.logger.warn('Fallback Polling is enabled but no PANCAKE_PAGE_IDS configured.');
            return;
        }
        const pageIds = env_1.env.PANCAKE_PAGE_IDS.split(',').map((id) => id.trim()).filter(Boolean);
        if (pageIds.length === 0) {
            return;
        }
        logger_1.logger.info({ cron: env_1.env.FALLBACK_SYNC_CRON, pageIds }, 'Initializing Pancake Fallback Polling Scheduler');
        this.task = node_cron_1.default.schedule(env_1.env.FALLBACK_SYNC_CRON, async () => {
            logger_1.logger.info('Executing scheduled Pancake conversation fallback sync...');
            for (const pageId of pageIds) {
                try {
                    await pancake_api_service_1.PancakeApiService.syncPageConversations(pageId);
                }
                catch (error) {
                    logger_1.logger.error({ error: error.message, pageId }, 'Error in scheduled page sync');
                }
            }
        });
    }
    /**
     * Stop scheduled background polling
     */
    static stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            logger_1.logger.info('Stopped Pancake Fallback Polling Scheduler');
        }
    }
}
exports.SyncSchedulerService = SyncSchedulerService;
//# sourceMappingURL=sync-scheduler.service.js.map