"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
// Health Check
router.get('/pancake', (req, res) => {
    const challenge = req.query['hub.challenge'] || req.query.challenge;
    if (challenge) {
        return res.status(200).send(challenge);
    }
    res.status(200).json({
        status: 'active',
        message: 'Pancake Webhook Endpoint is Live & Ready',
        timestamp: new Date().toISOString(),
    });
});
// Logs Endpoint (all path variations)
const logsHandler = async (_req, res) => {
    await (0, prisma_1.ensureDatabaseSchema)();
    try {
        const logs = await prisma_1.prisma.webhookEventLog.findMany({
            take: 20,
            orderBy: { receivedAt: 'desc' },
        });
        res.json({ success: true, count: logs.length, data: logs });
    }
    catch (err) {
        res.json({ success: false, error: err.message, data: [] });
    }
};
router.get('/logs', logsHandler);
router.get('/webhook/logs', logsHandler);
router.get('/webhooks/logs', logsHandler);
router.get('/api/webhooks/logs', logsHandler);
// Inbound Webhook Listener
router.post('/pancake', auth_middleware_1.pancakeAuthMiddleware, webhook_controller_1.WebhookController.handlePancakeWebhook);
router.post('/', auth_middleware_1.pancakeAuthMiddleware, webhook_controller_1.WebhookController.handlePancakeWebhook);
router.post('/webhook', auth_middleware_1.pancakeAuthMiddleware, webhook_controller_1.WebhookController.handlePancakeWebhook);
router.post('/webhooks', auth_middleware_1.pancakeAuthMiddleware, webhook_controller_1.WebhookController.handlePancakeWebhook);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map