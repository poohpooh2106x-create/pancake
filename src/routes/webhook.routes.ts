import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { pancakeAuthMiddleware } from '../middleware/auth.middleware';
import { prisma, ensureDatabaseSchema } from '../db/prisma';

const router = Router();

// Health Check
router.get('/pancake', (req: Request, res: Response) => {
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
const logsHandler = async (_req: Request, res: Response) => {
  await ensureDatabaseSchema();
  try {
    const logs = await prisma.webhookEventLog.findMany({
      take: 20,
      orderBy: { receivedAt: 'desc' },
    });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err: any) {
    res.json({ success: false, error: err.message, data: [] });
  }
};

router.get('/logs', logsHandler);
router.get('/webhook/logs', logsHandler);
router.get('/webhooks/logs', logsHandler);
router.get('/api/webhooks/logs', logsHandler);

// Inbound Webhook Listener
router.post('/pancake', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);
router.post('/', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);
router.post('/webhook', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);
router.post('/webhooks', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);

export default router;
