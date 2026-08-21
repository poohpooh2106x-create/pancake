import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { pancakeAuthMiddleware } from '../middleware/auth.middleware';
import { prisma, ensureDatabaseSchema } from '../db/prisma';

const router = Router();

// GET /api/webhooks/pancake - Webhook Verification Challenge & Health Check for Pancake
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

// GET /api/webhooks/logs - View recent incoming webhook logs
router.get('/logs', async (_req: Request, res: Response) => {
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
});

// POST /api/webhooks/pancake - Inbound Webhook Event Listener
router.post('/pancake', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);

// POST /api/webhooks (Alternative root webhook path)
router.post('/', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);

export default router;
