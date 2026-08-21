"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const pancake_parser_service_1 = require("../services/pancake-parser.service");
const customer_service_1 = require("../services/customer.service");
const prisma_1 = require("../db/prisma");
const logger_1 = require("../utils/logger");
class WebhookController {
    /**
     * Handle Inbound Webhooks from Pancake POS / Pancake Chat
     * URL: POST /api/webhooks/pancake
     */
    static async handlePancakeWebhook(req, res) {
        await (0, prisma_1.ensureDatabaseSchema)();
        const startTime = Date.now();
        const payload = req.body;
        const eventType = payload.event || payload.type || 'pancake_event';
        const pageId = String(payload.page_id || payload.data?.page_id || '');
        let status = 'SUCCESS';
        let errorMessage = null;
        let customer = null;
        try {
            logger_1.logger.info({ eventType, pageId, payloadKeys: Object.keys(payload || {}) }, 'Processing inbound Pancake webhook');
            // 1. Parse customer & phone details
            const parsedData = pancake_parser_service_1.PancakeParserService.parseWebhookPayload(payload);
            if (!parsedData) {
                status = 'SKIPPED';
                logger_1.logger.warn({ eventType }, 'Webhook payload contained no actionable customer info');
            }
            else {
                // 2. Persist to database & trigger Google Sheets sync
                customer = await customer_service_1.CustomerService.processAndSaveCustomer(parsedData);
                if (customer) {
                    logger_1.logger.info({
                        customerId: customer.pancakeCustomerId,
                        primaryPhone: customer.primaryPhone,
                        platform: customer.platform,
                    }, 'Successfully extracted & synced customer data from webhook');
                }
            }
        }
        catch (error) {
            status = 'FAILED';
            errorMessage = error.message;
            logger_1.logger.error({ error: error.message, stack: error.stack, eventType }, 'Error processing Pancake webhook');
        }
        finally {
            // 3. Record Webhook Event Audit Log
            const processingTimeMs = Date.now() - startTime;
            try {
                await prisma_1.prisma.webhookEventLog.create({
                    data: {
                        eventType,
                        pageId: pageId || null,
                        payload: JSON.stringify(payload),
                        status,
                        errorMessage,
                        processingTimeMs,
                    },
                });
            }
            catch (dbErr) {
                logger_1.logger.error({ error: dbErr.message }, 'Failed to record webhook event log to database');
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            customerId: customer?.pancakeCustomerId || null,
            received_at: new Date().toISOString(),
        });
    }
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhook.controller.js.map