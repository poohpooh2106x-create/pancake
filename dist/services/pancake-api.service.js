"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PancakeApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const pancake_parser_service_1 = require("./pancake-parser.service");
const customer_service_1 = require("./customer.service");
class PancakeApiService {
    static client = axios_1.default.create({
        baseURL: env_1.env.PANCAKE_API_BASE_URL,
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    /**
     * Fetch conversations from Pancake API for a specific page
     */
    static async fetchConversations(pageId, pageNumber = 1, pageSize = 50) {
        if (!env_1.env.PANCAKE_API_ACCESS_TOKEN) {
            logger_1.logger.warn('Pancake API Access Token is not configured');
            return [];
        }
        try {
            const response = await this.client.get(`/pages/${pageId}/conversations`, {
                params: {
                    access_token: env_1.env.PANCAKE_API_ACCESS_TOKEN,
                    page_number: pageNumber,
                    page_size: pageSize,
                },
            });
            return response.data?.conversations || response.data?.data || [];
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, pageId }, 'Failed to fetch conversations from Pancake API');
            return [];
        }
    }
    /**
     * Fetch historical messages for a specific conversation
     */
    static async fetchMessages(pageId, conversationId) {
        if (!env_1.env.PANCAKE_API_ACCESS_TOKEN)
            return [];
        try {
            const response = await this.client.get(`/pages/${pageId}/conversations/${conversationId}/messages`, {
                params: {
                    access_token: env_1.env.PANCAKE_API_ACCESS_TOKEN,
                },
            });
            return response.data?.messages || response.data?.data || [];
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, conversationId }, 'Failed to fetch conversation messages');
            return [];
        }
    }
    /**
     * Polling routine: sync latest conversations for all configured pages
     */
    static async syncPageConversations(pageId) {
        logger_1.logger.info({ pageId }, 'Starting Pancake historical conversation polling sync...');
        const conversations = await this.fetchConversations(pageId, 1, 30);
        let processedCount = 0;
        for (const conv of conversations) {
            try {
                const payload = {
                    event: 'conversation_updated',
                    page_id: pageId,
                    data: {
                        conversation: conv,
                        customer: conv.customer,
                        message: conv.recent_message || conv.last_message,
                    },
                };
                const parsed = pancake_parser_service_1.PancakeParserService.parseWebhookPayload(payload);
                if (parsed) {
                    await customer_service_1.CustomerService.processAndSaveCustomer(parsed);
                    processedCount++;
                }
            }
            catch (err) {
                logger_1.logger.warn({ error: err.message, convId: conv.id }, 'Error processing historical conversation');
            }
        }
        logger_1.logger.info({ pageId, processedCount }, 'Completed Pancake polling sync');
        return processedCount;
    }
}
exports.PancakeApiService = PancakeApiService;
//# sourceMappingURL=pancake-api.service.js.map